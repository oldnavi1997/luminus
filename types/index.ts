import { Product, Category, Order, OrderItem, User } from "@/app/generated/prisma/client";

export type ProductWithCategory = Product & {
  categories: Category[];
};

/**
 * Lo que la ficha le pasa al botón de agregar y al LensDrawer, que son Client
 * Components: sólo valores planos. El producto de Prisma trae `Decimal`, que
 * React no puede serializar de servidor a cliente.
 */
export type ProductoAlCarrito = Pick<
  Product,
  "id" | "name" | "slug" | "images" | "skipCharges" | "stockAlmacen" | "stockTienda"
> & {
  price: number;
  needsLens: boolean;
};

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product;
  })[];
  user?: User | null;
};

export type PrescriptionData = {
  od: { sphere: string; cylinder: string; axis: string };
  oi: { sphere: string; cylinder: string; axis: string };
  add?: string;
  pd?: string;
};

export type CartItem = {
  id: string;
  cartKey?: string;
  name: string;
  price: number;
  image?: string;
  imageUrl?: string;
  quantity: number;
  slug: string;
  stock: number;
  /** Producto sin costo de envío ni comisión (ver `Product.skipCharges`). */
  skipCharges?: boolean;
  lensType?: "sin_medida" | "con_medida" | "solo_montura";
  lensSubType?: string;
  lensVariant?: string;
  lensPrice?: number;
  lensPriceRange?: string;
  prescriptionUrl?: string;
  prescription?: PrescriptionData;
};

export type ColorVariantProduct = {
  id: string;
  name: string;
  slug: string;
  frameColor: string | null;
  images: string[];
  active: boolean;
};

export type ShippingFormData = {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  country: string;
  courier: "shalom" | "olva";
  documentType?: "DNI" | "CE";
  documentNumber?: string;
};
