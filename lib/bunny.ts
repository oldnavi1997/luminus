import { createHash } from "node:crypto";

/**
 * Bunny Stream — los videos de producto.
 *
 * Por qué no Cloudinary: en el plan gratuito cada segundo de video codificado se
 * cobra como 2 transformaciones (4 si es HD) y cada reproducción descarga contra
 * la cuota de ancho de banda. Bunny codifica gratis y cobra centavos por GB, así
 * que se sube la calidad original sin mirar créditos. Las fotos y los videos de
 * fondo siguen en Cloudinary.
 *
 * El archivo nunca pasa por Vercel: el servidor crea el video y firma la subida,
 * y el navegador sube directo a Bunny por TUS (reanudable).
 *
 * La codificación estándar **va en cola**: medido en septiembre de 2026, entre 15
 * y 25 minutos para un clip de segundos (sólo la codificación premium es
 * inmediata). Por eso el admin guarda apenas termina la subida y es la ficha del
 * producto la que oculta lo que todavía no está listo — ver
 * `ocultarVideosSinProcesar()`.
 */

const API = "https://video.bunnycdn.com";
export const TUS_ENDPOINT = `${API}/tusupload`;

/** Un GUID de Bunny. Se valida antes de meterlo en una URL de la API. */
export const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `status` del objeto video en la API. **No** son los mismos números que manda
 * el webhook de Stream (ahí 3 es "terminado"): no mezclarlos.
 */
export const ESTADO_VIDEO = {
  TERMINADO: 4,
  ERROR: 5,
  SUBIDA_FALLIDA: 6,
} as const;

/** Sin las tres, el admin sube los videos a Cloudinary como antes. */
export function bunnyConfigured(): boolean {
  return Boolean(
    process.env.BUNNY_STREAM_LIBRARY_ID &&
      process.env.BUNNY_STREAM_API_KEY &&
      process.env.BUNNY_STREAM_HOST
  );
}

function config() {
  if (!bunnyConfigured()) throw new Error("Bunny Stream no está configurado");
  return {
    libraryId: process.env.BUNNY_STREAM_LIBRARY_ID!,
    apiKey: process.env.BUNNY_STREAM_API_KEY!,
    host: process.env.BUNNY_STREAM_HOST!.replace(/^https?:\/\//, "").replace(/\/$/, ""),
  };
}

class BunnyError extends Error {
  constructor(readonly status: number, detalle: string) {
    super(`Bunny ${status}: ${detalle}`);
  }
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  const { libraryId, apiKey } = config();
  const res = await fetch(`${API}/library/${libraryId}${path}`, {
    ...init,
    headers: {
      AccessKey: apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new BunnyError(res.status, await res.text());
  return res;
}

/** Lo que se guarda en `Product.images`. `lib/media.ts` lo reconoce por la forma. */
export function urlPlaylist(guid: string): string {
  return `https://${config().host}/${guid}/playlist.m3u8`;
}

/** El GUID de una URL de esta biblioteca, o null si no es un video de Bunny nuestro. */
function guidDeUrl(url: string): string | null {
  if (!bunnyConfigured()) return null;
  const m = url.match(/^https:\/\/([^/]+)\/([^/]+)\/playlist\.m3u8$/i);
  if (!m || m[1] !== config().host || !GUID.test(m[2])) return null;
  return m[2];
}

/** Crea el video vacío; la subida TUS necesita su GUID. */
export async function crearVideo(titulo: string): Promise<string> {
  const res = await api("/videos", {
    method: "POST",
    body: JSON.stringify({ title: titulo }),
  });
  const { guid } = (await res.json()) as { guid: string };
  return guid;
}

/**
 * Firma de la subida TUS: SHA256(libraryId + apiKey + expira + guid).
 * La API key queda en el servidor; el navegador sólo recibe el hash, que sirve
 * para ese video y hasta `expira`.
 */
export function firmarSubida(guid: string, validezSegundos = 2 * 60 * 60) {
  const { libraryId, apiKey } = config();
  const expira = Math.floor(Date.now() / 1000) + validezSegundos;
  const firma = createHash("sha256")
    .update(`${libraryId}${apiKey}${expira}${guid}`)
    .digest("hex");
  return { libraryId, firma, expira };
}

export async function estadoVideo(guid: string, init?: RequestInit) {
  const res = await api(`/videos/${guid}`, init);
  const v = (await res.json()) as { status: number; encodeProgress: number };
  return { status: v.status, encodeProgress: v.encodeProgress };
}

export async function borrarVideo(guid: string): Promise<void> {
  await api(`/videos/${guid}`, { method: "DELETE" });
}

/**
 * Un video terminado no vuelve atrás, así que se recuerda y deja de consultarse.
 * Vive lo que viva la instancia del servidor; en frío se vuelve a preguntar una vez.
 */
const listos = new Set<string>();

/**
 * Quita de la galería los videos de Bunny que todavía no se pueden reproducir:
 * en cola, fallidos o borrados de la biblioteca. Sin esto el cliente vería un
 * recuadro negro con la miniatura rota durante los minutos de cola.
 *
 * Si la API de Bunny no responde a tiempo se muestra igual: el CDN que sirve el
 * video es otro servicio, y ocultar todos los videos por una API lenta es peor
 * que arriesgar uno sin procesar.
 */
export async function ocultarVideosSinProcesar(images: string[]): Promise<string[]> {
  const visibles = await Promise.all(
    images.map(async (url) => {
      const guid = guidDeUrl(url);
      if (!guid || listos.has(guid)) return true;
      try {
        const { status } = await estadoVideo(guid, { signal: AbortSignal.timeout(2500) });
        if (status !== ESTADO_VIDEO.TERMINADO) return false;
        listos.add(guid);
        return true;
      } catch (err) {
        return !(err instanceof BunnyError && err.status === 404);
      }
    })
  );
  return images.filter((_, i) => visibles[i]);
}
