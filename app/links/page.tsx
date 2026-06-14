import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Instagram, MessageCircle, ShoppingBag, Music2, Link as LinkIcon, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Links · Luminus Eyewear",
  description: "Todos los enlaces de Luminus Eyewear en un solo lugar.",
  robots: { index: false, follow: false },
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  "message-circle": MessageCircle,
  whatsapp: MessageCircle,
  "shopping-bag": ShoppingBag,
  tiktok: Music2,
  link: LinkIcon,
};

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

export default async function LinksPage() {
  const [profile, links] = await Promise.all([
    prisma.bioProfile.findUnique({ where: { id: "main" } }),
    prisma.bioLink.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const handle = profile?.handle ?? "@luminus.eyewear";
  const tagline = profile?.tagline ?? "Ver bien y verte bien";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-6 pt-12 pb-16">
      <div className="flex flex-col items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
          {profile?.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={handle}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <span className="font-display text-base font-semibold uppercase tracking-[0.18em] text-[#111111]">
              Luminus
            </span>
          )}
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-[#111111]">{handle}</h1>
        {tagline && <p className="mt-1 text-sm text-[#5a5a5a]">{tagline}</p>}

        <div className="mt-4 flex items-center gap-3">
          {profile?.instagramUrl && (
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="rounded-full p-2 text-[#111111] transition hover:bg-black/5"
            >
              <Instagram className="h-5 w-5" />
            </a>
          )}
          {profile?.tiktokUrl && (
            <a
              href={profile.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="rounded-full p-2 text-[#111111] transition hover:bg-black/5"
            >
              <Music2 className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      <ul className="mt-10 flex w-full flex-col gap-3">
        {links.map((link) => {
          const Icon = link.icon ? ICONS[link.icon] : null;
          const external = isExternal(link.url);
          const className =
            "group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-center text-sm font-medium text-[#111111] shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md";

          const content = (
            <>
              {Icon && <Icon className="absolute left-5 h-5 w-5 text-[#111111]" />}
              <span className="px-6">{link.label}</span>
              {external && (
                <ExternalLink className="absolute right-5 h-4 w-4 text-[#9ca3af] opacity-0 transition group-hover:opacity-100" />
              )}
            </>
          );

          return (
            <li key={link.id}>
              {external ? (
                <a href={link.url} target="_blank" rel="noopener noreferrer" className={className}>
                  {content}
                </a>
              ) : (
                <Link href={link.url} className={className}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-12 text-xs text-[#9ca3af]">© {new Date().getFullYear()} Luminus Eyewear</p>
    </div>
  );
}
