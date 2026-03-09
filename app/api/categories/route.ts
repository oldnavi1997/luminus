import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  try {
    const { name, slug, description } = await req.json();
    if (!name || !slug) {
      return NextResponse.json({ error: "Nombre y slug son requeridos" }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: { name, slug, description: description || null },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
