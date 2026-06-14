import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  handle: z.string().min(1).max(80),
  avatarUrl: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  tagline: z.string().max(200).nullable().optional().or(z.literal("").transform(() => null)),
  instagramUrl: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  tiktokUrl: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
});

export async function GET() {
  const profile = await prisma.bioProfile.findUnique({ where: { id: "main" } });
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const data = {
    handle: parsed.data.handle,
    avatarUrl: parsed.data.avatarUrl ?? null,
    tagline: parsed.data.tagline ?? null,
    instagramUrl: parsed.data.instagramUrl ?? null,
    tiktokUrl: parsed.data.tiktokUrl ?? null,
  };
  const profile = await prisma.bioProfile.upsert({
    where: { id: "main" },
    update: data,
    create: { id: "main", ...data },
  });
  return NextResponse.json(profile);
}
