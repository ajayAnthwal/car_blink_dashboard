import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";

const vehicleSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  registrationNumber: z.string().min(1, "Registration Number is required"),
  fuelType: z.string().min(1, "Fuel Type is required"),
  year: z.coerce.number().min(1990, "Year must be 1990 or later").max(new Date().getFullYear(), "Invalid year"),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  brands: unknown[];
  models: unknown[];
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  initialData?: VehicleFormValues | null;
  onBrandChange: (brandId: string) => void;
  onSubmit: (data: VehicleFormValues) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
}

export function VehicleForm({
  brands,
  models,
  isLoadingBrands,
  isLoadingModels,
  initialData,
  onBrandChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: VehicleFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: {
      brand: "",
      model: "",
      registrationNumber: "",
      fuelType: "",
      year: new Date().getFullYear(),
    },
  });

  const selectedBrand = watch("brand");

  useEffect(() => {
    if (selectedBrand) {
      onBrandChange(selectedBrand);
    }
  }, [selectedBrand, onBrandChange]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        brand: "",
        model: "",
        registrationNumber: "",
        fuelType: "",
        year: new Date().getFullYear(),
      });
    }
  }, [initialData, reset]);

  const fuelOptions = [
    { value: "PETROL", label: "Petrol" },
    { value: "DIESEL", label: "Diesel" },
    { value: "CNG", label: "CNG" },
    { value: "EV", label: "Electric" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            label="Vehicle Brand"
            value={selectedBrand}
            onChange={(e) => {
              setValue("brand", e.target.value);
              setValue("model", ""); // Reset model on brand change
            }}
            options={brands.map((b: any) => ({ value: b._id, label: b.name }))}
            disabled={isLoadingBrands}
            required
          />
          {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand.message}</p>}
        </div>

        <div>
          <Select
            label="Vehicle Model"
            value={watch("model")}
            onChange={(e) => setValue("model", e.target.value)}
            options={models.map((m: any) => ({ value: m._id, label: m.name }))}
            disabled={!selectedBrand || isLoadingModels}
            required
          />
          {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
        </div>

        <div>
          <Input
            label="Registration Number"
            placeholder="e.g. MH 01 AB 1234"
            {...register("registrationNumber")}
          />
          {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Fuel Type"
              value={watch("fuelType")}
              onChange={(e) => setValue("fuelType", e.target.value)}
              options={fuelOptions}
              required
            />
            {errors.fuelType && <p className="text-red-500 text-xs mt-1">{errors.fuelType.message}</p>}
          </div>

          <div>
            <Input
              label="Year"
              type="number"
              min="1990"
              max={new Date().getFullYear()}
              placeholder="2022"
              {...register("year")}
            />
            {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {initialData ? "Update Vehicle" : "Save Vehicle"}
        </Button>
      </div>
    </form>
  );
}
