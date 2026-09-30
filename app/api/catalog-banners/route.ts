import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Las franjas del catálogo (ver CatalogBanner en el schema). Una por categoría;
// `categoryId: null` es la de "Ver todo". El listado es force-dynamic, así que
// guardar aquí ya cambia /lentes sin revalidar nada.

// Sólo nuestro Cloudinary: es lo que el loader de next/image sabe achicar.
const urlCloudinary = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://res.cloudinary.com/"), "La imagen tiene que subirse desde el panel");

const bannerSchema = z.object({
  categoryId: z.string().min(1).nullable(),
  imageUrl: urlCloudinary,
  mobileImageUrl: urlCloudinary.nullable().optional(),
  title: z.string().trim().min(1, "Falta el título").max(120),
  text: z.string().trim().max(600).nullable().optional(),
  active: z.boolean().default(true),
});

async function esAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user.role === "ADMIN";
}

export async function PUT(req: Request) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const parsed = bannerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { categoryId, ...resto } = parsed.data;
  const data = { ...resto, text: resto.text || null, mobileImageUrl: resto.mobileImageUrl || null };

  if (categoryId) {
    const existe = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!existe) return NextResponse.json({ error: "La categoría no existe" }, { status: 404 });
  }

  // Un `@unique` nullable no sirve de `where` en un upsert, así que "Ver todo"
  // (null) se busca a mano. Las categorías van por su id.
  const actual = await prisma.catalogBanner.findFirst({ where: { categoryId } });
  const banner = actual
    ? await prisma.catalogBanner.update({ where: { id: actual.id }, data })
    : await prisma.catalogBanner.create({ data: { ...data, categoryId } });

  return NextResponse.json(banner);
}

export async function DELETE(req: Request) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const categoryId = new URL(req.url).searchParams.get("categoryId") || null;
  await prisma.catalogBanner.deleteMany({ where: { categoryId } });
  return NextResponse.json({ ok: true });
}
