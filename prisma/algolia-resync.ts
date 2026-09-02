/**
 * Reconstruye el índice del buscador a partir de la base.
 *
 * Es la red de seguridad de `lib/algolia-sync.ts`: las escrituras sincronizan
 * una a una, pero cualquier cosa que falle (Algolia caída, un script que tocó la
 * base por fuera, todo lo que el POS hizo antes de que existiera el aviso) deja
 * desfase. Esto lo cuadra de una pasada.
 *
 *   npm run algolia:resync -- --prod              # sólo informa
 *   npm run algolia:resync -- --prod --aplicar    # escribe
 *
 * Por defecto NO escribe, y la base hay que elegirla a mano. El índice es uno
 * solo y lo consume la web en producción: aplicarlo desde la base local lo
 * dejaría con el catálogo de desarrollo.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

type RegistroIndice = { objectID: string; name?: string; price?: number; stock?: number };

async function main() {
  const prod = process.argv.includes("--prod");
  const aplicar = process.argv.includes("--aplicar");

  if (prod) {
    const url = process.env.DATABASE_URL_PROD;
    if (!url) {
      console.error("Falta DATABASE_URL_PROD en .env.local");
      process.exit(1);
    }
    process.env.DATABASE_URL = url;
  }

  // Después de fijar DATABASE_URL: `lib/prisma` la lee al importarse.
  const { registrosPublicables } = await import("../lib/algolia-sync");
  const { getAdminClient, INDEX_NAME } = await import("../lib/algolia");
  const { prisma } = await import("../lib/prisma");

  const client = getAdminClient();

  const actuales = new Map<string, RegistroIndice>();
  await client.browseObjects<RegistroIndice>({
    indexName: INDEX_NAME,
    browseParams: { attributesToRetrieve: ["objectID", "name", "price", "stock"] },
    aggregator: (respuesta) => {
      for (const hit of respuesta.hits) actuales.set(hit.objectID, hit);
    },
  });

  const deseados = await registrosPublicables();
  const publicables = new Set(deseados.map((r) => r.objectID));

  const nuevos = deseados.filter((r) => !actuales.has(r.objectID));
  const desfasados = deseados.filter((r) => {
    const previo = actuales.get(r.objectID);
    return (
      previo &&
      (previo.price !== r.price || previo.stock !== r.stock || previo.name !== r.name)
    );
  });
  const sobrantes = [...actuales.keys()].filter((id) => !publicables.has(id));

  console.log(`Base:   ${prod ? "PRODUCCIÓN" : "local"} · publicables: ${deseados.length}`);
  console.log(`Índice: ${INDEX_NAME} · registros: ${actuales.size}`);
  console.log(`  faltan en el índice:               ${nuevos.length}`);
  console.log(`  con nombre/precio/stock desfasado: ${desfasados.length}`);
  console.log(`  sobran en el índice:               ${sobrantes.length}`);
  for (const id of sobrantes.slice(0, 15)) {
    console.log(`    - ${actuales.get(id)?.name ?? "(sin nombre)"} [${id}]`);
  }
  if (sobrantes.length > 15) console.log(`    … y ${sobrantes.length - 15} más`);

  if (!aplicar) {
    console.log("\nNada escrito. Repetir con --aplicar para cuadrar el índice.");
  } else {
    if (deseados.length > 0) {
      await client.saveObjects({ indexName: INDEX_NAME, objects: deseados, waitForTasks: true });
    }
    if (sobrantes.length > 0) {
      await client.deleteObjects({ indexName: INDEX_NAME, objectIDs: sobrantes, waitForTasks: true });
    }
    console.log(`\nÍndice cuadrado: ${deseados.length} indexados, ${sobrantes.length} borrados.`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
