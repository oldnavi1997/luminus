import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Luminus – Lentes premium",
    template: "%s | Luminus",
  },
  description: "Tu destino de confianza para lentes de calidad en Perú.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navCategories = await prisma.category.findMany({
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

  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <Providers>
          <Navbar categories={navCategories} />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
