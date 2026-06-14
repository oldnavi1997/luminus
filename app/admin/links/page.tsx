import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BioLinkTable } from "@/components/admin/BioLinkTable";

export const metadata = { title: "Links | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
  const [profile, links] = await Promise.all([
    prisma.bioProfile.findUnique({ where: { id: "main" } }),
    prisma.bioLink.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
            Bio pública
          </p>
          <h1
            className="text-2xl font-light text-[#111111]"
            style={{ fontFamily: "var(--font-inter, sans-serif)" }}
          >
            Links (/links)
          </h1>
          <p className="mt-1 text-xs text-[#111111]/50">
            Reemplaza Linktree. Pega <span className="font-mono">luminus.pe/links</span> en tu bio de TikTok/IG.
          </p>
        </div>
        <Link
          href="/admin/links/perfil"
          className="text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.2em] hover:text-[#d4af37] transition-colors"
        >
          Editar perfil →
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 text-xs text-[#111111]/70">
        <div className="border border-[#111111]/6 bg-white px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#111111]/40">Handle</p>
          <p className="mt-1 font-medium text-[#111111]">{profile?.handle ?? "—"}</p>
        </div>
        <div className="border border-[#111111]/6 bg-white px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#111111]/40">Tagline</p>
          <p className="mt-1 font-medium text-[#111111]">{profile?.tagline ?? "—"}</p>
        </div>
      </div>

      <div className="bg-white border border-[#111111]/6">
        <BioLinkTable links={links} />
      </div>
    </div>
  );
}
