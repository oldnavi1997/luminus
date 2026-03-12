import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/app/generated/prisma/client";

const variantSelect = {
  id: true,
  name: true,
  slug: true,
  frameColor: true,
  images: true,
  active: true,
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      colorVariants: { select: { variant: { select: variantSelect } } },
      isVariantOf: { select: { product: { select: variantSelect } } },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const seen = new Set<string>();
  const variants = [
    ...product.colorVariants.map((cv) => cv.variant),
    ...product.isVariantOf.map((cv) => cv.product),
  ].filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  const { colorVariants: _cv, isVariantOf: _iv, ...rest } = product;
  return NextResponse.json({ ...rest, variants });
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  images: z.array(z.string()).optional(),
  brand: z.string().optional(),
  frameType: z.string().optional(),
  frameMaterial: z.string().optional(),
  frameColor: z.string().optional(),
  lensType: z.string().optional(),
  gender: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  categoryId: z.string().optional(),
  variantIds: z.array(z.string()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { variantIds, ...rest } = updateSchema.parse(body);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.price !== undefined && { price: new Prisma.Decimal(rest.price) }),
        ...(rest.comparePrice !== undefined && {
          comparePrice: rest.comparePrice ? new Prisma.Decimal(rest.comparePrice) : null,
        }),
      },
      include: { category: true },
    });

    if (variantIds !== undefined) {
      await prisma.$transaction([
        prisma.productColorVariant.deleteMany({
          where: { OR: [{ productId: id }, { variantId: id }] },
        }),
        prisma.productColorVariant.createMany({
          data: variantIds.flatMap((vid) => [
            { productId: id, variantId: vid },
            { productId: vid, variantId: id },
          ]),
          skipDuplicates: true,
        }),
      ]);
    }

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
