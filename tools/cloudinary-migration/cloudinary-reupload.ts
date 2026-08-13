/**
 * Re-uploads the backed-up originals to the NEW Cloudinary account, preserving
 * every public_id so the path after the cloud name stays identical.
 *
 *   npx tsx tools/cloudinary-migration/cloudinary-reupload.ts [backupDir]
 *
 * Credentials come from CLOUDINARY_TARGET_* if set, otherwise from the primary
 * NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.
 * The guard against writing to the wrong account compares the resolved cloud name
 * against the `source_cloud` recorded in manifest.json, not against an env var,
 * so it holds even after the env is cut over to the new account.
 *
 * Safe to re-run: lists the target account once and skips assets already there
 * with a matching byte count. Never deletes or writes to the source account.
 *
 * Writes manifest-target.json, which the DB rewrite step uses to build the new URLs.
 */
import { v2 as cloudinary } from "cloudinary";
import * as dotenv from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

dotenv.config({ path: ".env.local" });

const BACKUP_DIR = resolve(process.argv[2] ?? "D:/Cursor/cloudinary-backup-luminus");
const CONCURRENCY = 6;
const MAX_RETRIES = 4;

const usingTargetVars = Boolean(process.env.CLOUDINARY_TARGET_CLOUD_NAME);
const TARGET = usingTargetVars
  ? {
      cloud_name: process.env.CLOUDINARY_TARGET_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_TARGET_API_KEY,
      api_secret: process.env.CLOUDINARY_TARGET_API_SECRET,
    }
  : {
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };

const mb = (b: number) => (b / 1024 / 1024).toFixed(2);

interface ManifestEntry {
  public_id: string;
  resource_type: "image" | "video";
  type: string;
  format: string;
  bytes: number;
  version: number;
  secure_url: string;
  file: string;
  source: string[];
}

interface Uploaded {
  public_id: string;
  resource_type: "image" | "video";
  format: string;
  bytes: number;
  version: number;
  secure_url: string;
}

/** One paginated sweep instead of per-asset lookups: the Admin API allows only
 *  500 calls/hour on free plans, and we have thousands of assets. */
async function targetInventory(): Promise<Map<string, Uploaded>> {
  const inv = new Map<string, Uploaded>();
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

async function upload(e: ManifestEntry): Promise<Uploaded> {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await cloudinary.uploader.upload(e.file, {
        public_id: e.public_id, // no extension: Cloudinary appends .format itself
        resource_type: e.resource_type,
        overwrite: false,
        use_filename: false,
        unique_filename: false,
        invalidate: false,
      });
      return {
        public_id: r.public_id,
        resource_type: e.resource_type,
        format: r.format,
        bytes: r.bytes,
        version: r.version,
        secure_url: r.secure_url,
      };
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
    }
  }
}

async function main() {
  for (const [k, v] of Object.entries(TARGET)) {
    if (!v) throw new Error(`Falta la credencial "${k}" de la cuenta destino en .env.local`);
  }

  const manifestPath = join(BACKUP_DIR, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    source_cloud: string;
    assets: ManifestEntry[];
  };

  // The one guard that matters: never write back into the account we backed up from.
  if (TARGET.cloud_name === manifest.source_cloud) {
    throw new Error(
      `La cuenta destino (${TARGET.cloud_name}) es la de origen del respaldo. Abortando.`
    );
  }

  cloudinary.config(TARGET);

  const assets = manifest.assets;
  console.log(`origen : ${manifest.source_cloud} (solo lectura, no se toca)`);
  console.log(`destino: ${TARGET.cloud_name} (via ${usingTargetVars ? "CLOUDINARY_TARGET_*" : "vars primarias"})`);
  console.log(`respaldo: ${BACKUP_DIR}`);
  console.log(`assets a subir: ${assets.length} = ${mb(assets.reduce((s, a) => s + a.bytes, 0))} MB\n`);

  console.log("listando la cuenta destino...");
  const existing = await targetInventory();
  console.log(`ya hay ${existing.size} assets en destino\n`);

  const results = new Map<string, Uploaded>();
  const failed: { public_id: string; error: string }[] = [];
  let done = 0;
  let skipped = 0;
  let bytesUp = 0;

  const queue = [...assets];
  async function worker() {
    for (;;) {
      const e = queue.shift();
      if (!e) return;
      try {
        const already = existing.get(e.public_id);
        if (already && already.bytes === e.bytes) {
          results.set(e.public_id, already);
          skipped++;
        } else {
          const up = await upload(e);
          if (up.bytes !== e.bytes) {
            throw new Error(`bytes no coinciden: subio ${up.bytes}, original ${e.bytes}`);
          }
          results.set(e.public_id, up);
          bytesUp += up.bytes;
        }
      } catch (err) {
        failed.push({ public_id: e.public_id, error: (err as Error).message });
      }
      if (++done % 100 === 0 || done === assets.length) {
        console.log(`  ${done}/${assets.length}  ${mb(bytesUp)} MB subidos  (${skipped} ya estaban, ${failed.length} fallos)`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Sanity check: same public_id set, same bytes, on the new account.
  const mismatched = assets.filter((a) => {
    const r = results.get(a.public_id);
    return !r || r.bytes !== a.bytes || r.public_id !== a.public_id;
  });

  await writeFile(
    join(BACKUP_DIR, "manifest-target.json"),
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source_cloud: manifest.source_cloud,
        target_cloud: TARGET.cloud_name,
        counts: {
          expected: assets.length,
          ok: results.size,
          failed: failed.length,
          mismatched: mismatched.length,
        },
        failed,
        assets: [...results.values()].sort((a, b) => a.public_id.localeCompare(b.public_id)),
      },
      null,
      2
    )
  );

  console.log(`\n=== resultado ===`);
  console.log(`en destino OK : ${results.size}/${assets.length}`);
  console.log(`subidos ahora : ${mb(bytesUp)} MB`);
  console.log(`ya estaban    : ${skipped}`);
  console.log(`fallidos      : ${failed.length}`);
  failed.slice(0, 20).forEach((f) => console.log(`   ${f.public_id}: ${f.error}`));
  console.log(`discrepancias : ${mismatched.length}`);
  mismatched.slice(0, 20).forEach((a) => console.log(`   ${a.public_id}`));
  console.log(`manifest      : ${join(BACKUP_DIR, "manifest-target.json")}`);

  if (failed.length || mismatched.length) {
    console.log(`\nNO sigas con el rewrite de la DB. Volve a correr este script para reintentar.`);
    process.exitCode = 1;
  } else {
    console.log(`\nTodo migrado y verificado. Siguiente paso: rewrite de Product.images.`);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
