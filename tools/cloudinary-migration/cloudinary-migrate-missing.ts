/**
 * Migrates Cloudinary assets that a database references but that are not yet on
 * the target account, pulling each one over its PUBLIC delivery URL — so it needs
 * no credentials for the old account.
 *
 *   npx tsx tools/cloudinary-migration/cloudinary-migrate-missing.ts --db DATABASE_URL_PROD
 *   npx tsx tools/cloudinary-migration/cloudinary-migrate-missing.ts --db DATABASE_URL_PROD --apply
 *
 * Why this exists: the initial backup was built from the LOCAL database plus the
 * luminus-products/ folder. Production had 319 more product images, uploaded
 * through the admin widget straight into the account root, which existed in no
 * local record. The live site keeps accruing those, so run this again right
 * before the cutover to catch anything uploaded in the meantime.
 *
 * Target credentials come from NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY
 * / CLOUDINARY_API_SECRET. Dry-run by default.
 *
 * Downloads land in the backup dir so it stays a complete copy, and the results
 * are appended to manifest-extra.json.
 */
import { v2 as cloudinary } from "cloudinary";
import { Client } from "pg";
import * as dotenv from "dotenv";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

dotenv.config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const dbFlagIdx = process.argv.indexOf("--db");
const DB_ENV = dbFlagIdx >= 0 ? process.argv[dbFlagIdx + 1] : "DATABASE_URL";
const BACKUP_DIR = resolve(process.env.CLOUDINARY_BACKUP_DIR ?? "D:/Cursor/cloudinary-backup-luminus");
const CONCURRENCY = 6;
const MAX_RETRIES = 4;

const TARGET_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
cloudinary.config({
  cloud_name: TARGET_CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const mb = (b: number) => (b / 1024 / 1024).toFixed(2);

interface Missing {
  url: string;
  cloud: string;
  public_id: string;
  ext: string;
  resource_type: "image" | "video";
}

/**
 * The version segment is OPTIONAL: once a database has been rewritten, its URLs
 * are versionless. Requiring /v<digits>/ made this return null for every already
 * migrated URL, which quietly turned the "what is still missing" check into a
 * no-op — and would have skipped a versionless URL still on the old cloud.
 */
function parse(url: string): Missing | null {
  const m = url.match(/res\.cloudinary\.com\/([^/]+)\/(image|video)\/upload\/(.+)$/);
  if (!m) return null;
  const [, cloud, resource_type, rest] = m;

  const parts = rest.split("/");
  // Leading transformation segments look like `w_640,q_auto,c_limit`. Never strip
  // the final segment, so a root-level public_id is safe.
  while (parts.length > 1 && /^[a-z]{1,3}_[^/]*$/.test(parts[0])) parts.shift();
  if (parts.length > 1 && /^v\d+$/.test(parts[0])) parts.shift();

  const tail = parts.join("/");
  if (!tail) return null;
  const ext = (tail.match(/\.([a-z0-9]+)$/i) ?? [, ""])[1];
  return {
    url,
    cloud,
    public_id: tail.replace(/\.[a-z0-9]+$/i, ""),
    ext,
    resource_type: resource_type as "image" | "video",
  };
}

async function targetInventory(): Promise<Map<string, number>> {
  const inv = new Map<string, number>();
  for (const resource_type of ["image", "video"] as const) {
    let next_cursor: string | undefined;
    do {
      const res = await cloudinary.api.resources({
        resource_type,
        type: "upload",
        max_results: 500,
        next_cursor,
      });
      for (const r of res.resources) inv.set(r.public_id, r.bytes);
      next_cursor = res.next_cursor;
    } while (next_cursor);
  }
  return inv;
}

async function fetchOriginal(m: Missing): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(m.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
}

async function main() {
  const dbUrl = process.env[DB_ENV];
  if (!dbUrl) throw new Error(`Falta la variable ${DB_ENV} en .env.local`);

  console.log(`base    : ${DB_ENV} (${dbUrl.replace(/\/\/[^@]+@/, "//<oculto>@")})`);
  console.log(`destino : ${TARGET_CLOUD}`);
  console.log(`respaldo: ${BACKUP_DIR}`);
  console.log(`modo    : ${APPLY ? "APPLY (sube)" : "DRY-RUN (no sube)"}\n`);

  const c = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 20000 });
  await c.connect();
  const rows = await c.query<{ u: string }>(
    `SELECT DISTINCT u FROM "Product" p, unnest(p.images) u WHERE u LIKE '%res.cloudinary.com%'`
  );
  await c.end();

  const parsed = rows.rows.map((r) => parse(r.u)).filter((x): x is Missing => x !== null);
  const unparsed = rows.rows.length - parsed.length;

  console.log("listando la cuenta destino...");
  const inv = await targetInventory();

  const missing = parsed.filter((p) => p.cloud !== TARGET_CLOUD && !inv.has(p.public_id));
  const already = parsed.length - missing.length;

  console.log(`URLs de Cloudinary en la base : ${rows.rows.length}`);
  console.log(`no parseables                 : ${unparsed}`);
  console.log(`ya presentes en ${TARGET_CLOUD}      : ${already}`);
  console.log(`FALTAN por migrar             : ${missing.length}\n`);

  if (!missing.length) {
    console.log("Nada que hacer: la base esta completamente cubierta por la cuenta nueva.");
    return;
  }

  const byKind = missing.reduce<Record<string, number>>((a, m) => {
    a[m.resource_type] = (a[m.resource_type] ?? 0) + 1;
    return a;
  }, {});
  console.log(`por tipo: ${JSON.stringify(byKind)}`);
  missing.slice(0, 5).forEach((m) => console.log(`   ${m.public_id}.${m.ext}`));

  if (!APPLY) {
    console.log(`\nDry-run. Volve a correr con --apply para migrarlos.`);
    return;
  }

  const done: { public_id: string; bytes: number; version: number; secure_url: string }[] = [];
  const failed: { public_id: string; error: string }[] = [];
  let n = 0;
  let bytesTotal = 0;

  const queue = [...missing];
  async function worker() {
    for (;;) {
      const m = queue.shift();
      if (!m) return;
      try {
        const buf = await fetchOriginal(m);

        // Keep the backup dir a complete copy of everything we migrated.
        const file = join(BACKUP_DIR, m.resource_type, `${m.public_id}.${m.ext}`);
        const existing = await stat(file).catch(() => null);
        if (!existing || existing.size !== buf.length) {
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, buf);
        }

        const up = await cloudinary.uploader.upload(`data:application/octet-stream;base64,${buf.toString("base64")}`, {
          public_id: m.public_id,
          resource_type: m.resource_type,
          overwrite: false,
          use_filename: false,
          unique_filename: false,
          invalidate: false,
        });
        if (up.bytes !== buf.length) {
          throw new Error(`bytes no coinciden: subio ${up.bytes}, original ${buf.length}`);
        }
        done.push({ public_id: up.public_id, bytes: up.bytes, version: up.version, secure_url: up.secure_url });
        bytesTotal += up.bytes;
      } catch (err) {
        failed.push({ public_id: m.public_id, error: (err as Error).message });
      }
      if (++n % 50 === 0 || n === missing.length) {
        console.log(`  ${n}/${missing.length}  ${mb(bytesTotal)} MB  (${failed.length} fallos)`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const path = join(BACKUP_DIR, "manifest-extra.json");
  const prev = await readFile(path, "utf8").then((t) => JSON.parse(t)).catch(() => ({ runs: [] }));
  prev.runs.push({
    generated_at: new Date().toISOString(),
    db_env: DB_ENV,
    target_cloud: TARGET_CLOUD,
    counts: { attempted: missing.length, ok: done.length, failed: failed.length },
    failed,
    assets: done.sort((a, b) => a.public_id.localeCompare(b.public_id)),
  });
  await writeFile(path, JSON.stringify(prev, null, 2));

  console.log(`\n=== resultado ===`);
  console.log(`migrados : ${done.length}/${missing.length} = ${mb(bytesTotal)} MB`);
  console.log(`fallidos : ${failed.length}`);
  failed.slice(0, 20).forEach((f) => console.log(`   ${f.public_id}: ${f.error}`));
  console.log(`manifest : ${path}`);
  if (failed.length) {
    console.log(`\nNO sigas con el rewrite. Volve a correr para reintentar los que faltan.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
