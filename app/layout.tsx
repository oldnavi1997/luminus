import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar, type NavCategory } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StoreChrome } from "@/components/layout/StoreChrome";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { prisma } from "@/lib/prisma";
import { AnalyticsProvider } from "@/components/layout/AnalyticsProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Luminus – Lentes con estilo",
    template: "%s | Luminus",
  },
  description: "Tu destino de confianza para lentes de calidad en Perú.",
  openGraph: {
    siteName: "Luminus",
    locale: "es_PE",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let navCategories: NavCategory[] = [];
  try {
    const roots = await prisma.category.findMany({
      where: { parentId: null, slug: { notIn: ["sin-categorizar", "uncategorized"] } },
      include: {
        children: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            children: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    // Adjuntar hasta 2 imágenes de productos destacados por categoría raíz (mega menú)
    navCategories = await Promise.all(
      roots.map(async (cat) => {
        const descendantIds = [
          cat.id,
          ...cat.children.flatMap((c) => [c.id, ...c.children.map((g) => g.id)]),
        ];
        const prods = await prisma.product.findMany({
          where: {
            active: true,
            images: { isEmpty: false },
            categories: { some: { id: { in: descendantIds } } },
          },
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
          take: 2,
          select: { images: true, slug: true, name: true },
        });
        return {
          ...cat,
          promos: prods.map((p) => ({ image: p.images[0], slug: p.slug, name: p.name })),
        };
      })
    );
  } catch {
    // DB unavailable during build (e.g. Railway build phase)
  }

  return (
    <html lang="es" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <Providers>
          <StoreChrome><Navbar categories={navCategories} /></StoreChrome>
          <main className="flex-1">{children}</main>
          <StoreChrome><Footer /></StoreChrome>
          <StoreChrome><WhatsAppButton /></StoreChrome>
        </Providers>
        <AnalyticsProvider />
      </body>
    </html>
  );
}
