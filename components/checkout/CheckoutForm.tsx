"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const shippingSchema = z.object({
  name: z.string().min(2, "Ingresa tu nombre completo"),

  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().min(5, "Ingresa tu dirección"),
  city: z.string().min(2, "Ingresa tu ciudad"),
  province: z.string().min(2, "Selecciona tu región"),
  postal: z.string().min(4, "Ingresa tu código postal"),
  country: z.string(),
});

type ShippingData = z.infer<typeof shippingSchema>;

interface CheckoutFormProps {
  onSubmit: (data: ShippingData) => void;
  loading?: boolean;
}

const REGIONES = [
  "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho",
  "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco",
  "Ica", "Junín", "La Libertad", "Lambayeque", "Lima",
  "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura",
  "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali",
];

export function CheckoutForm({ onSubmit, loading }: CheckoutFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { country: "Perú" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1a1a2e]">Datos de envío</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre completo *"
          placeholder="Juan Pérez"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email *"
          type="email"
          placeholder="juan@email.com"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>

      <Input
        label="Teléfono"
        type="tel"
        placeholder="+51 987 654 321"
        error={errors.phone?.message}
        {...register("phone")}
      />

      <Input
        label="Dirección *"
        placeholder="Av. Larco 1234, Miraflores"
        error={errors.address?.message}
        {...register("address")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Ciudad *"
          placeholder="Lima"
          error={errors.city?.message}
          {...register("city")}
        />
        <Select
          label="Región *"
          error={errors.province?.message}
          {...register("province")}
        >
          <option value="">Selecciona...</option>
          {REGIONES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
        <Input
          label="Código postal *"
          placeholder="15001"
          error={errors.postal?.message}
          {...register("postal")}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Continuar al pago
      </Button>
    </form>
  );
}
