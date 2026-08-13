/**
 * Backs up every Cloudinary original that belongs to Luminus, before migrating
 * off the shared `dzqns7kss` account.
 *
 *   npx tsx tools/cloudinary-migration/cloudinary-download-originals.ts [outDir]
 *
 * Scope (see SCOPE below): assets referenced by Product.images or by the source
 * tree, plus everything under luminus-products/ (including orphans we chose to
 * keep). Deliberately excludes samples/, adama*, and unreferenced root assets —
 * those are Adamantio's or unclassified.
 *
 * Safe to re-run: it skips files already on disk whose size matches Cloudinary,
 * so an interrupted run resumes instead of starting over.
 *
 * Writes manifest.json, which 02-reupload needs to recreate each asset under the
 * SAME public_id on the new account.
 */
import { v2 as cloudinary } from "cloudinary";
import { Client } from "pg";
import * as dotenv from "dotenv";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

dotenv.config({ path: ".env.local" });

const OUT_DIR = resolve(process.argv[2] ?? "D:/Cursor/cloudinary-backup-luminus");
const CONCURRENCY = 8;
const MAX_RETRIES = 4;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const mb = (b: number) => (b / 1024 / 1024).toFixed(2);

interface Asset {
  public_id: string;
  resource_type: "image" | "video";
  type: string;
  format: string;
  bytes: number;
  version: number;
  secure_url: string;
  width?: number;
  height?: number;
}

interface ManifestEntry extends Asset {
  file: string;
  source: string[];
  downloaded_bytes: number;
}

/** Strips transformations, version and extension from a delivery URL. */
function publicIdFromUrl(url: string): string | null {
  const m = url.match(/\/upload\/(?:[^/]*\/)*?v\d+\/(.+)$/);
  if (!m) return null;
  return m[1].replace(/\.[a-z0-9]+$/i, "");
}

async function referencedByDb(): Promise<Set<string>> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query<{ u: string }>(
    `SELECT DISTINCT u FROM "Product" p, unnest(p.images) u WHERE u LIKE '%res.cloudinary.com%'`
  );
  await c.end();
  const out = new Set<string>();
  for (const { u } of r.rows) {
    const pid = publicIdFromUrl(u);
    if (pid) out.add(pid);
  }
  return out;
}

async function referencedByCode(): Promise<Set<string>> {
  const out = new Set<string>();
  const skip = new Set(["node_modules", ".next", ".git", "app/generated"]);
  async function walk(dir: string) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (!skip.has(e.name)) await walk(p);
      } else if (/\.(tsx?|css)$/.test(e.name)) {
        const text = await readFile(p, "utf8");
        for (const m of text.matchAll(/res\.cloudinary\.com\/[^"'`\s)]+/g)) {
          const pid = publicIdFromUrl(m[0]);
          if (pid) out.add(pid);
        }
      }
    }
  }
  await walk(resolve("."));
  return out;
}

async function inventory(): Promise<Map<string, Asset>> {
  const inv = new Map<string, Asset>();
  for (const resource_type of ["image", "video"] as const) {
    let next_cursor: string | undefined;
    do {
      const res = await cloudinary.api.resources({
        resource_type,
        type: "upload",
        max_results: 500,
        next_cursor,
      });
      for (const r of res.resources) inv.set(r.public_id, { ...r, resource_type });
      next_cursor = res.next_cursor;
    } while (next_cursor);
  }
  return inv;
}

async function download(a: Asset, file: string): Promise<number> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(a.secure_url);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      await mkdir(dirname(file), { recursive: true });
      await pipeline(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]), createWriteStream(file));
      return (await stat(file)).size;
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
}

async function main() {
  console.log(`destino: ${OUT_DIR}\n`);

  const [db, code, inv] = await Promise.all([referencedByDb(), referencedByCode(), inventory()]);
  console.log(`referencias: DB=${db.size}  codigo=${code.size}  inventario cuenta=${inv.size}`);

  // SCOPE
  const wanted = new Map<string, string[]>();
  const add = (pid: string, why: string) => {
    const cur = wanted.get(pid);
    if (cur) cur.push(why);
    else wanted.set(pid, [why]);
  };
  for (const pid of db) add(pid, "db:Product.images");
  for (const pid of code) add(pid, "code");
  for (const pid of inv.keys()) {
    if (pid.startsWith("luminus-products/")) add(pid, "folder:luminus-products");
  }

  const missing: string[] = [];
  const targets: Asset[] = [];
  for (const pid of wanted.keys()) {
    const a = inv.get(pid);
    if (a) targets.push(a);
    else missing.push(pid);
  }

  const totalBytes = targets.reduce((s, a) => s + a.bytes, 0);
  const vids = targets.filter((a) => a.resource_type === "video");
  console.log(
    `a descargar: ${targets.length} assets = ${mb(totalBytes)} MB ` +
      `(${vids.length} video = ${mb(vids.reduce((s, a) => s + a.bytes, 0))} MB)`
  );
  if (missing.length) {
    console.log(`\nAVISO: ${missing.length} referenciados que no existen en Cloudinary:`);
    missing.slice(0, 20).forEach((p) => console.log(`   ${p}`));
  }
  console.log("");

  const manifest: ManifestEntry[] = [];
  const failed: { public_id: string; error: string }[] = [];
  let done = 0;
  let skipped = 0;
  let bytesGot = 0;

  const queue = [...targets];
  async function worker() {
    for (;;) {
      const a = queue.shift();
      if (!a) return;
      // Mirror the public_id as a path so folders survive the round trip.
      const file = join(OUT_DIR, a.resource_type, `${a.public_id}.${a.format}`);
      try {
        let size = 0;
        const existing = await stat(file).catch(() => null);
        if (existing && existing.size === a.bytes) {
          size = existing.size;
          skipped++;
        } else {
          size = await download(a, file);
          if (size !== a.bytes) {
            throw new Error(`tamano no coincide: ${size} != ${a.bytes} esperados`);
          }
        }
        bytesGot += size;
        manifest.push({ ...a, file, source: wanted.get(a.public_id)!, downloaded_bytes: size });
      } catch (err) {
        failed.push({ public_id: a.public_id, error: (err as Error).message });
      }
      if (++done % 100 === 0 || done === targets.length) {
        console.log(`  ${done}/${targets.length}  ${mb(bytesGot)} MB  (${skipped} ya estaban, ${failed.length} fallos)`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source_cloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        counts: { wanted: targets.length, ok: manifest.length, failed: failed.length, missing: missing.length },
        missing,
        failed,
        assets: manifest.sort((a, b) => a.public_id.localeCompare(b.public_id)),
      },
      null,
      2
    )
  );

  console.log(`\n=== resultado ===`);
  console.log(`descargados OK : ${manifest.length}/${targets.length} = ${mb(bytesGot)} MB`);
  console.log(`ya en disco    : ${skipped}`);
  console.log(`fallidos       : ${failed.length}`);
  failed.slice(0, 20).forEach((f) => console.log(`   ${f.public_id}: ${f.error}`));
  console.log(`manifest       : ${join(OUT_DIR, "manifest.json")}`);
  if (failed.length) {
    console.log(`\nVolve a correr el script para reintentar solo los que faltan.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
