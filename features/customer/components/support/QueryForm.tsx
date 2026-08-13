import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";

const querySchema = z.object({
  bookingId: z.string().min(1, "Please select a booking"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  subject: z.string().min(1, "Query Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export type QueryFormValues = z.infer<typeof querySchema>;

interface QueryFormProps {
  bookings: unknown[];
  onSubmit: (data: QueryFormValues) => void;
  isSubmitting: boolean;
}

export function QueryForm({ bookings, onSubmit, isSubmitting }: QueryFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<QueryFormValues>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      bookingId: "",
      priority: "MEDIUM",
      subject: "",
      description: "",
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => {
      onSubmit(data);
      reset();
    })} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            label="Booking"
            value={watch("bookingId")}
            onChange={(e) => setValue("bookingId", e.target.value)}
            options={bookings.map((b: any) => ({
              value: b._id,
              label: `${b.vehicleId?.brand || ''} ${b.vehicleId?.model || ''} - ${b.serviceId?.name || ''}`.trim(),
            }))}
            disabled={bookings.length === 0}
            required
          />
          {errors.bookingId && <p className="text-red-500 text-xs mt-1">{errors.bookingId.message}</p>}
        </div>

        <div>
          <Select
            label="Priority"
            value={watch("priority")}
            onChange={(e) => setValue("priority", e.target.value as any)}
            options={[
              { value: "LOW", label: "Low" },
              { value: "MEDIUM", label: "Medium" },
              { value: "HIGH", label: "High" },
            ]}
            required
          />
          {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>}
        </div>

        <div className="md:col-span-2">
          <Input
            label="Query Title / Subject"
            placeholder="e.g. Need help with my recent booking"
            {...register("subject")}
          />
          {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-dark mb-1.5">Description</label>
          <textarea
            {...register("description")}
            rows={3}
            className="flex w-full rounded-lg border border-neutral-muted/40 bg-neutral-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting} disabled={bookings.length === 0}>
          Submit Query
        </Button>
      </div>
      {bookings.length === 0 && (
        <p className="text-xs text-neutral-muted">You need at least one booking to raise a query.</p>
      )}
    </form>
  );
}
