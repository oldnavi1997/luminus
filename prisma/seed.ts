import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash("Admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@luminus.pe" },
    update: {},
    create: {
      email: "admin@luminus.pe",
      name: "Admin Luminus",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Categories
  const categories = [
    {
      name: "Anteojos de Sol",
      slug: "anteojos-de-sol",
      description: "Protección UV con estilo para cada ocasión",
      imageUrl: null,
    },
    {
      name: "Anteojos de Receta",
      slug: "anteojos-de-receta",
      description: "Marcos para lentes ópticos con diseño y comodidad",
      imageUrl: null,
    },
    {
      name: "Lentes de Contacto",
      slug: "lentes-de-contacto",
      description: "Visión perfecta sin marcos",
      imageUrl: null,
    },
    {
      name: "Accesorios",
      slug: "accesorios",
      description: "Estuches, cadenas y cuidado de tus lentes",
      imageUrl: null,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Fetch category IDs
  const catSol = await prisma.category.findUnique({ where: { slug: "anteojos-de-sol" } });
  const catReceta = await prisma.category.findUnique({ where: { slug: "anteojos-de-receta" } });

  // Products con precios en Soles (PEN)
  const products = [
    {
      name: "Ray-Ban Aviator Classic",
      slug: "ray-ban-aviator-classic",
      description: "El ícono atemporal. Armazón de metal dorado con lentes de cristal verde G-15. Protección UV400.",
      price: 320,
      comparePrice: 420,
      stock: 15,
      brand: "Ray-Ban",
      frameType: "Aviador",
      frameMaterial: "Metal",
      frameColor: "Dorado",
      lensType: "Polarizado",
      gender: "Unisex",
      featured: true,
      active: true,
      categoryId: catSol!.id,
      images: [
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80",
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
      ],
    },
    {
      name: "Oakley Holbrook Matte Black",
      slug: "oakley-holbrook-matte-black",
      description: "Diseño robusto con armazón de acetato negro mate y lentes Prizm. Ideal para deportes y actividades al aire libre.",
      price: 280,
      comparePrice: null,
      stock: 8,
      brand: "Oakley",
      frameType: "Rectangular",
      frameMaterial: "Acetato",
      frameColor: "Negro",
      lensType: "Prizm",
      gender: "Hombre",
      featured: true,
      active: true,
      categoryId: catSol!.id,
      images: [
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80",
      ],
    },
    {
      name: "Carrera 228 Azul Espejado",
      slug: "carrera-228-azul-espejado",
      description: "Estilo contemporáneo con lentes espejadas azules. Armazón de acetato liviano con protección UV total.",
      price: 189,
      comparePrice: 249,
      stock: 20,
      brand: "Carrera",
      frameType: "Cuadrado",
      frameMaterial: "Acetato",
      frameColor: "Azul",
      lensType: "Espejado",
      gender: "Mujer",
      featured: false,
      active: true,
      categoryId: catSol!.id,
      images: [
        "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80",
      ],
    },
    {
      name: "Tom Ford FT5634 Óptico",
      slug: "tom-ford-ft5634-optico",
      description: "Sofisticación italiana. Armazón rectangular de acetato tortoise con bisagras de barril. Ideal para lentes de aumento o filtro de luz azul.",
      price: 370,
      comparePrice: null,
      stock: 6,
      brand: "Tom Ford",
      frameType: "Rectangular",
      frameMaterial: "Acetato",
      frameColor: "Havana",
      lensType: "Óptico",
      gender: "Hombre",
      featured: true,
      active: true,
      categoryId: catReceta!.id,
      images: [
        "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&q=80",
      ],
    },
    {
      name: "Prada PR 05YV Redondo",
      slug: "prada-pr-05yv-redondo",
      description: "Elegancia minimalista con armazón redondo de metal dorado. Versátil para todo tipo de rostro, perfecto para receta o sol.",
      price: 459,
      comparePrice: 560,
      stock: 4,
      brand: "Prada",
      frameType: "Redondo",
      frameMaterial: "Metal",
      frameColor: "Dorado",
      lensType: "Óptico",
      gender: "Mujer",
      featured: true,
      active: true,
      categoryId: catReceta!.id,
      images: [
        "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=800&q=80",
      ],
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        price: product.price,
        comparePrice: product.comparePrice,
      },
      create: {
        ...product,
        price: product.price,
        comparePrice: product.comparePrice,
      },
    });
  }

  console.log("✅ Seed completado: admin + 4 categorías + 5 productos (precios en PEN)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
