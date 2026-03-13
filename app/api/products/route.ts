import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/app/generated/prisma/client";
import { indexProduct } from "@/lib/algolia-sync";

const productCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string()).default([]),
  brand: z.string().optional(),
  frameType: z.string().optional(),
  frameMaterial: z.string().optional(),
  frameColor: z.string().optional(),
  lensType: z.string().optional(),
  gender: z.string().optional(),
  dimTotalWidth: z.string().optional(),
  dimLensWidth: z.string().optional(),
  dimFrameHeight: z.string().optional(),
  dimBridgeWidth: z.string().optional(),
  dimTempleLength: z.string().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  categoryIds: z.array(z.string()).min(1),
  primaryCategoryId: z.string(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const where: Prisma.ProductWhereInput = {};
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const gender = searchParams.get("gender");
  const frameType = searchParams.get("frameType");
  const featured = searchParams.get("featured");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(48, parseInt(searchParams.get("limit") || "24"));

  if (!searchParams.has("admin")) where.active = true;
  if (category) where.categories = { some: { slug: category } };
  if (gender) where.gender = gender;
  if (frameType) where.frameType = frameType;
  if (featured === "true") where.featured = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
    ];
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = new Prisma.Decimal(minPrice);
    if (maxPrice) where.price.lte = new Prisma.Decimal(maxPrice);
  }

  const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    newest: { createdAt: "desc" },
    name_asc: { name: "asc" },
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { categories: true },
      orderBy: sortMap[sort] || { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, pages: Math.ceil(total / limit), page });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { categoryIds, primaryCategoryId, ...rest } = productCreateSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        ...rest,
        price: new Prisma.Decimal(rest.price),
        comparePrice: rest.comparePrice ? new Prisma.Decimal(rest.comparePrice) : null,
        primaryCategoryId,
        categories: { connect: categoryIds.map((id) => ({ id })) },
      },
      include: { categories: true },
    });

    const primaryCat = product.categories.find((c) => c.id === product.primaryCategoryId) ?? product.categories[0];
    await indexProduct({ ...product, category: primaryCat ?? null }).catch(console.error);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
