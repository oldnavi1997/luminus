"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const registerSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al registrarse");
        return;
      }

      await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      toast.success("¡Cuenta creada exitosamente!");
      router.push("/");
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Unite a Luminus</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre completo"
            placeholder="Juan Pérez"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            placeholder="Repetí tu contraseña"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Crear cuenta
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-[#c9a84c] hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
