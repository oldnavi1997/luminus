import { Product, Category, Order, OrderItem, User } from "@/app/generated/prisma/client";

export type ProductWithCategory = Product & {
  category: Category;
};

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product;
  })[];
  user?: User | null;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  imageUrl?: string;
  quantity: number;
  slug: string;
  stock: number;
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
};
