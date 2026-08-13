/**
 * Points Product.images at the new Cloudinary account.
 *
 *   npx tsx tools/cloudinary-migration/cloudinary-rewrite-db.ts --dry-run   # default: shows the diff, writes nothing
 *   npx tsx tools/cloudinary-migration/cloudinary-rewrite-db.ts --apply     # writes
 *
 * Two changes per URL:
 *   1. cloud name  dzqns7kss -> <target>
 *   2. drops the /v<digits>/ segment. The re-upload assigns a NEW version, so
 *      keeping the old number would leave every URL pointing at a version that
 *      does not exist on the new account. Versionless URLs resolve fine and are
 *      immune to this for any future move.
 *
 * Refuses to run unless every public_id it is about to rewrite is confirmed
 * present on the target account, per manifest-target.json.
 *
 * Backs up the current values to product-images-backup.json before writing.
 */
import { Client } from "pg";
import * as dotenv from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

dotenv.config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const dirArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
const BACKUP_DIR = resolve(dirArg ?? process.env.CLOUDINARY_BACKUP_DIR ?? "D:/Cursor/cloudinary-backup-luminus");

/** Rewrites one delivery URL; returns null if it is not a Cloudinary URL. */
function rewrite(url: string, sourceCloud: string, targetCloud: string): string | null {
  if (!url.includes("res.cloudinary.com")) return null;
  return url
    .replace(`res.cloudinary.com/${sourceCloud}/`, `res.cloudinary.com/${targetCloud}/`)
    .replace(/\/upload\/v\d+\//, "/upload/");
}

function publicIdFromUrl(url: string): string | null {
  const m = url.match(/\/upload\/(?:[^/]*\/)*?v\d+\/(.+)$/);
  if (!m) return null;
  return m[1].replace(/\.[a-z0-9]+$/i, "");
}

async function main() {
  const target = JSON.parse(await readFile(join(BACKUP_DIR, "manifest-target.json"), "utf8")) as {
    source_cloud: string;
    target_cloud: string;
    counts: { failed: number; mismatched: number };
    assets: { public_id: string }[];
  };

  if (target.counts.failed || target.counts.mismatched) {
    throw new Error(
      `El re-upload dejo ${target.counts.failed} fallos y ${target.counts.mismatched} discrepancias. Arreglalo antes de tocar la DB.`
    );
  }
  const onTarget = new Set(target.assets.map((a) => a.public_id));
  console.log(`origen : ${target.source_cloud}`);
  console.log(`destino: ${target.target_cloud}`);
  console.log(`assets confirmados en destino: ${onTarget.size}`);
  console.log(`modo   : ${APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)"}\n`);

  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const rows = (await c.query<{ id: string; images: string[] }>(`SELECT id, images FROM "Product"`)).rows;

  const backup: { id: string; images: string[] }[] = [];
  const updates: { id: string; images: string[] }[] = [];
  const notOnTarget: string[] = [];
  let urlsRewritten = 0;
  let urlsLeftAlone = 0;
  let alreadyDone = 0;

  for (const row of rows) {
    let changed = false;
    const next = row.images.map((url) => {
      const out = rewrite(url, target.source_cloud, target.target_cloud);
      if (out === null) {
        urlsLeftAlone++; // unsplash or anything non-Cloudinary
        return url;
      }
      // Already migrated: leave it be. Without this the run is not idempotent —
      // a migrated URL has no /v<version>/ for publicIdFromUrl to match, so it
      // would land in notOnTarget and abort a second, harmless run.
      if (url.includes(`res.cloudinary.com/${target.target_cloud}/`)) {
        alreadyDone++;
        return url;
      }
      const pid = publicIdFromUrl(url);
      if (!pid || !onTarget.has(pid)) {
        notOnTarget.push(url);
        return url; // leave pointing at the old account rather than break it
      }
      if (out !== url) {
        changed = true;
        urlsRewritten++;
      }
      return out;
    });
    if (changed) {
      backup.push({ id: row.id, images: row.images });
      updates.push({ id: row.id, images: next });
    }
  }

  console.log(`productos            : ${rows.length}`);
  console.log(`productos a modificar: ${updates.length}`);
  console.log(`URLs reescritas      : ${urlsRewritten}`);
  console.log(`URLs ya migradas     : ${alreadyDone} (sin tocar)`);
  console.log(`URLs no-Cloudinary   : ${urlsLeftAlone} (intactas)`);
  console.log(`URLs sin asset en destino: ${notOnTarget.length}`);
  notOnTarget.slice(0, 10).forEach((u) => console.log(`   ${u}`));

  const sample = updates[0];
  if (sample) {
    const before = backup.find((b) => b.id === sample.id)!;
    console.log(`\nejemplo:\n  antes : ${before.images[0]}\n  despues: ${sample.images[0]}`);
  }

  if (notOnTarget.length) {
    console.log(`\nABORTA: hay URLs cuyo asset no esta confirmado en la cuenta nueva.`);
    await c.end();
    process.exit(1);
  }

  if (!APPLY) {
    console.log(`\nDry-run. Volve a correr con --apply para escribir.`);
    await c.end();
    return;
  }

  await writeFile(
    join(BACKUP_DIR, "product-images-backup.json"),
    JSON.stringify({ generated_at: new Date().toISOString(), products: backup }, null, 2)
  );
  console.log(`\nrespaldo de valores previos: ${join(BACKUP_DIR, "product-images-backup.json")}`);

  await c.query("BEGIN");
  try {
    for (const u of updates) {
      await c.query(`UPDATE "Product" SET images = $1 WHERE id = $2`, [u.images, u.id]);
    }
    await c.query("COMMIT");
  } catch (err) {
    await c.query("ROLLBACK");
    throw err;
  }

  const left = await c.query<{ n: string }>(
    `SELECT count(*) AS n FROM "Product" p, unnest(p.images) u WHERE u LIKE '%${target.source_cloud}%'`
  );
  console.log(`\nlisto. URLs que aun apuntan a ${target.source_cloud}: ${left.rows[0].n}`);
  await c.end();
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
