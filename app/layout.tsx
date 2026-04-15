import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar, type NavCategory } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StoreChrome } from "@/components/layout/StoreChrome";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { prisma } from "@/lib/prisma";
import { Analytics } from "@vercel/analytics/next";

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
  title: {
    default: "Luminus – Lentes con estilo",
    template: "%s | Luminus",
  },
  description: "Tu destino de confianza para lentes de calidad en Perú.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let navCategories: NavCategory[] = [];
  try {
    navCategories = await prisma.category.findMany({
      where: { parentId: null, slug: { notIn: ["sin-categorizar", "uncategorized"] } },
      include: {
        children: {
          orderBy: { name: "asc" },
          include: {
            children: { orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
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
        <Analytics />
      </body>
    </html>
  );
}
