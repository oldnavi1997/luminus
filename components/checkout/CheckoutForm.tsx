"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPEN } from "@/lib/utils";
import { ShippingFormData } from "@/types";
import ubigeoData from "@/lib/peru-ubigeo.json";

type UbigeoJson = {
  departments: string[];
  provincesByDepartment: Record<string, string[]>;
  districtsByDepartmentProvince: Record<string, Record<string, { name: string; postalCode: string }[]>>;
};

const UBIGEO = ubigeoData as UbigeoJson;

const shippingSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(2, "Mínimo 2 caracteres"),
  lastName: z.string().min(2, "Mínimo 2 caracteres"),
  documentType: z.enum(["DNI", "CE"]),
  documentNumber: z.string(),
  phone: z.string().min(6, "Teléfono requerido"),
  street: z.string().min(3, "Ingresa tu dirección"),
  department: z.string().min(1, "Selecciona un departamento"),
  province: z.string().min(1, "Selecciona una provincia"),
  district: z.string().min(1, "Selecciona un distrito"),
  postalCode: z.string().min(1, "Código postal requerido"),
}).superRefine((data, ctx) => {
  if (data.documentType === "DNI" && !/^\d{8}$/.test(data.documentNumber)) {
    ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "El DNI debe tener 8 dígitos" });
  }
  if (data.documentType === "CE" && (data.documentNumber.length < 5 || data.documentNumber.length > 12)) {
    ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "El carnet debe tener entre 5 y 12 caracteres" });
  }
});

type FormData = z.infer<typeof shippingSchema>;

interface CheckoutFormProps {
  onSubmit: (data: ShippingFormData) => void;
  loading?: boolean;
  subtotal: number;
}

const selectClass = "w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#d4af37] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed";
const labelClass = "block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em] mb-1.5";
const errorClass = "text-[11px] text-red-600 tracking-wide mt-1";

export function CheckoutForm({ onSubmit, loading, subtotal }: CheckoutFormProps) {
  const [districtValue, setDistrictValue] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { documentType: "DNI" },
  });

  const department = watch("department");
  const province = watch("province");
  const documentType = watch("documentType");

  const provinceOptions = department ? (UBIGEO.provincesByDepartment[department] ?? []) : [];
  const districtOptions = department && province
    ? (UBIGEO.districtsByDepartmentProvince[department]?.[province] ?? [])
    : [];

  function handleDepartmentChange(value: string) {
    setValue("department", value);
    setValue("province", "");
    setValue("district", "");
    setValue("postalCode", "");
    setDistrictValue("");
  }

  function handleProvinceChange(value: string) {
    setValue("province", value);
    setValue("district", "");
    setValue("postalCode", "");
    setDistrictValue("");
  }

  function handleDistrictChange(value: string) {
    const [districtName, postalCode] = value.split("___");
    setDistrictValue(value);
    setValue("district", districtName ?? "");
    setValue("postalCode", postalCode ?? "");
  }

  function handleFormSubmit(data: FormData) {
    onSubmit({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      address: data.street,
      city: data.district,
      province: data.department,
      postal: data.postalCode,
      country: "Perú",
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">

      {/* Datos de contacto */}
      <div className="bg-white border border-[#d5d5d5]/60 p-6 space-y-4">
        <h3 className="text-[11px] font-medium text-[#1e293b] uppercase tracking-[0.2em]">
          Datos de contacto
        </h3>

        <Input
          label="Email *"
          type="email"
          placeholder="juan@email.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombres *"
            placeholder="Juan"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label="Apellidos *"
            placeholder="Pérez García"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tipo de documento *</label>
            <select className={selectClass} {...register("documentType")}>
              <option value="DNI">DNI</option>
              <option value="CE">Carnet de extranjería</option>
            </select>
          </div>
          <Input
            label={`Número de ${documentType === "DNI" ? "DNI" : "carnet"} *`}
            placeholder={documentType === "DNI" ? "12345678" : "000123456"}
            error={errors.documentNumber?.message}
            {...register("documentNumber")}
          />
        </div>

        <Input
          label="Teléfono *"
          type="tel"
          placeholder="+51 987 654 321"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>

      {/* Dirección de envío */}
      <div className="bg-white border border-[#d5d5d5]/60 p-6 space-y-4">
        <h3 className="text-[11px] font-medium text-[#1e293b] uppercase tracking-[0.2em]">
          Dirección de envío
        </h3>

        <Input
          label="Dirección (calle y número) *"
          placeholder="Av. Larco 1234, Miraflores"
          error={errors.street?.message}
          {...register("street")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Departamento *</label>
            <select
              className={selectClass}
              value={department ?? ""}
              onChange={(e) => handleDepartmentChange(e.target.value)}
            >
              <option value="">Selecciona...</option>
              {UBIGEO.departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.department && <p className={errorClass}>{errors.department.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Provincia *</label>
            <select
              className={selectClass}
              value={province ?? ""}
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={!department}
            >
              <option value="">Selecciona...</option>
              {provinceOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.province && <p className={errorClass}>{errors.province.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Distrito *</label>
            <select
              className={selectClass}
              value={districtValue}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!province}
            >
              <option value="">Selecciona...</option>
              {districtOptions.map((d) => (
                <option key={`${d.name}___${d.postalCode}`} value={`${d.name}___${d.postalCode}`}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.district && <p className={errorClass}>{errors.district.message}</p>}
          </div>
        </div>
      </div>

      {/* Resumen de costos */}
      <div className="bg-[#F8F7F4] border border-[#d5d5d5]/60 p-5 space-y-2.5">
        <div className="flex justify-between text-[12px] text-[#1e293b]/50">
          <span>Subtotal</span>
          <span>{formatPEN(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[12px] text-[#1e293b]/50">
          <span>Envío</span>
          <span className="text-emerald-600">Gratis</span>
        </div>
        <div className="flex justify-between text-[13px] font-semibold text-[#1e293b] pt-2 border-t border-[#d5d5d5]/60">
          <span>Total</span>
          <span className="text-[#d4af37]">{formatPEN(subtotal)}</span>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Continuar al pago
      </Button>
    </form>
  );
}
