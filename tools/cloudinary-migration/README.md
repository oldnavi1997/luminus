# Migración de Cloudinary

Luminus y Adamantio compartían la cuenta Cloudinary `dzqns7kss`. En agosto de 2026
esa cuenta pasó su límite y hubo que pagar un mes de plan Plus para reactivarla.
Estos scripts movieron Luminus a su propia cuenta (`sztba5xb`), dejando `dzqns7kss`
solo para Adamantio.

Se corrieron el 2026-08-12/13. Se dejan versionados como registro de qué se movió
y para poder repetir el procedimiento (por ejemplo, contra la base de producción).

## Orden

Los tres se corren desde la raíz del repo y leen credenciales de `.env.local`.

```bash
# 1. Respalda los originales de la cuenta vieja. Corre con las credenciales
#    de dzqns7kss todavía en .env.local.
npx tsx tools/cloudinary-migration/cloudinary-download-originals.ts [outDir]

# 2. Re-sube a la cuenta nueva conservando cada public_id.
npx tsx tools/cloudinary-migration/cloudinary-reupload.ts [backupDir]

# 3. Reapunta Product.images. Dry-run por defecto.
npx tsx tools/cloudinary-migration/cloudinary-rewrite-db.ts
npx tsx tools/cloudinary-migration/cloudinary-rewrite-db.ts --apply
```

Respaldo por defecto: `D:/Cursor/cloudinary-backup-luminus` (override por argumento
o `CLOUDINARY_BACKUP_DIR`). Contiene los originales más `manifest.json`,
`manifest-target.json` y `product-images-backup.json` (valores previos de la DB).

Los tres son resumibles e idempotentes: se pueden reintentar sin duplicar trabajo.

## Alcance

Se migraron **3154 assets / 222.86 MB**: los referenciados por `Product.images` o
por el código, más todo `luminus-products/` incluidos 1810 huérfanos sin referencia
en la DB, que se decidió conservar. Quedaron **fuera** a propósito: `samples/`
(demo de Cloudinary), `adama*` (Adamantio) y 522 assets de la raíz sin referencia
en Luminus, de propiedad no determinada.

`Product.images` es la **única** columna de la DB que guarda URLs de Cloudinary.
Se verificaron todas las demás columnas de texto y array del schema.

## Dos trampas que resolvieron estos scripts

**El `version` cambia al re-subir.** Las URLs guardadas tenían `/v1773263795/`
embebido; el re-upload asigna versiones nuevas, así que conservarlas dejaría las
1355 URLs apuntando a versiones inexistentes. El script elimina el segmento de
versión además de cambiar el cloud name — las URLs sin versión resuelven igual y
quedan inmunes a cualquier mudanza futura.

**La cuenta nueva usa modo de carpetas `dynamic`.** Ahí `asset_folder` es un campo
separado del `public_id`. El re-upload preserva el `public_id` (que es lo que hace
que las URLs funcionen) pero deja `asset_folder` vacío, así que buscar por `folder:`
devuelve 0 sobre 2948 assets. Por eso `app/api/admin/cloudinary/images/route.ts`
ya no filtra por carpeta.

## Lo que estos scripts NO hacen

- **El preset de upload** (`luminus-products`, unsigned) hay que recrearlo a mano en
  el dashboard de la cuenta nueva. El API no migra presets. Sin él, `ProductForm` y
  `BioProfileForm` no pueden subir imágenes.
- **Las env vars de producción** en Railway.
- **Borrar los assets de la cuenta vieja.** Es el único paso irreversible y debe
  esperar a que producción esté verificada. El respaldo local es la única red.
