"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type LoginData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    const result = await signIn("credentials", {
      ...data,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error("Email o contraseña incorrectos");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/";
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Iniciar sesión</h1>
          <p className="text-gray-500 text-sm mt-1">Accede a tu cuenta Luminus</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Ingresar
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/register" className="text-[#c9a84c] hover:underline font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
