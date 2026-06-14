import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BioProfileForm } from "@/components/admin/BioProfileForm";

export const metadata = { title: "Perfil bio | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBioProfilePage() {
  const profile = await prisma.bioProfile.findUnique({ where: { id: "main" } });

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/links"
          className="text-[10px] font-medium text-[#111111]/40 uppercase tracking-[0.2em] hover:text-[#d4af37] transition-colors"
        >
          ← Volver a links
        </Link>
        <p className="mt-3 text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
          Bio pública
        </p>
        <h1
          className="text-2xl font-light text-[#111111]"
          style={{ fontFamily: "var(--font-inter, sans-serif)" }}
        >
          Perfil
        </h1>
        <p className="mt-1 text-xs text-[#111111]/50">
          El header de <span className="font-mono">/links</span>: avatar, handle, tagline y íconos sociales.
        </p>
      </div>

      <div className="bg-white border border-[#111111]/6 p-6 max-w-2xl">
        <BioProfileForm
          initial={{
            handle: profile?.handle ?? "@luminus.eyewear",
            tagline: profile?.tagline ?? "",
            avatarUrl: profile?.avatarUrl ?? "",
            instagramUrl: profile?.instagramUrl ?? "",
            tiktokUrl: profile?.tiktokUrl ?? "",
          }}
        />
      </div>
    </div>
  );
}
