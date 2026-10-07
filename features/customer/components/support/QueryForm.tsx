// @ts-nocheck
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";

const querySchema = z.object({
  category: z.string().default("General Inquiry"),
  bookingId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  subject: z.string().min(1, "Query Title is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
});

export type QueryFormValues = z.infer<typeof querySchema>;

interface QueryFormProps {
  bookings: any[];
  defaultBookingId?: string;
  onSubmit: (data: QueryFormValues) => void;
  isSubmitting: boolean;
}

export function QueryForm({ bookings = [], defaultBookingId = "", onSubmit, isSubmitting }: QueryFormProps) {
  const safeBookings = Array.isArray(bookings) ? bookings : [];

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
      category: "General Inquiry",
      bookingId: defaultBookingId || (safeBookings.length > 0 ? (safeBookings[0]._id || safeBookings[0].id) : ""),
      priority: "MEDIUM",
      subject: "",
      description: "",
    },
  });

  useEffect(() => {
    if (defaultBookingId) {
      setValue("bookingId", defaultBookingId);
    } else if (safeBookings.length > 0 && !watch("bookingId")) {
      setValue("bookingId", safeBookings[0]._id || safeBookings[0].id);
    }
  }, [defaultBookingId, safeBookings, watch, setValue]);

  const selectedBookingId = watch("bookingId") || "";

  // Prepare booking options with a default "General Inquiry" choice
  const bookingOptions = [
    { value: "", label: "General Inquiry (Not linked to any booking)" },
    ...safeBookings.map((b: any) => {
      const bId = b._id || b.id;
      const vBrand = b.vehicleId?.brand || 'Vehicle';
      const vModel = b.vehicleId?.model || '';
      const vReg = b.vehicleId?.registrationNumber ? `(${b.vehicleId.registrationNumber})` : '';
      const sName = b.serviceId?.name || 'Service Request';
      const bRef = String(bId).slice(-6).toUpperCase();
      return {
        value: bId,
        label: `Booking #${bRef}: ${vBrand} ${vModel} ${vReg} — ${sName}`,
      };
    })
  ];

  return (
    <form onSubmit={handleSubmit((data) => {
      const cleanData = {
        ...data,
        bookingId: data.bookingId && data.bookingId.trim() !== "" ? data.bookingId.trim() : undefined,
      };
      onSubmit(cleanData);
      reset({
        category: "General Inquiry",
        bookingId: defaultBookingId || (safeBookings.length > 0 ? (safeBookings[0]._id || safeBookings[0].id) : ""),
        priority: "MEDIUM",
        subject: "",
        description: "",
      });
    })} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            label="Relevant Booking / Vehicle"
            value={selectedBookingId}
            onChange={(e) => setValue("bookingId", e.target.value)}
            options={bookingOptions}
          />
          {errors.bookingId && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.bookingId.message}</p>}
        </div>

        <div>
          <Select
            label="Category"
            value={watch("category") || "General Inquiry"}
            onChange={(e) => setValue("category", e.target.value)}
            options={[
              { value: "General Inquiry", label: "General Inquiry" },
              { value: "Booking Issue", label: "Booking & Service Issue" },
              { value: "Payment & Billing", label: "Payment & Billing Query" },
              { value: "Vehicle Service Quality", label: "Vehicle Service Quality" },
              { value: "Warranty Claim", label: "Warranty Claim & Support" },
            ]}
          />
        </div>

        <div>
          <Select
            label="Priority Level"
            value={watch("priority")}
            onChange={(e) => setValue("priority", e.target.value as any)}
            options={[
              { value: "LOW", label: "Low Priority" },
              { value: "MEDIUM", label: "Medium Priority" },
              { value: "HIGH", label: "High / Urgent Priority" },
            ]}
          />
          {errors.priority && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.priority.message}</p>}
        </div>

        <div className="md:col-span-2">
          <Input
            label="Query Subject / Title"
            placeholder="e.g. Question regarding my brake service or refund status"
            {...register("subject")}
          />
          {errors.subject && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.subject.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Detailed Description</label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Please describe your question, complaint, or request in detail..."
            className="flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.description.message}</p>}
        </div>
      </div>
      
      <div className="flex justify-end pt-2">
        <Button 
          type="submit" 
          isLoading={isSubmitting} 
          className="bg-primary-orange hover:bg-orange-600 text-white font-bold rounded-xl px-8 py-3 text-sm shadow-md"
        >
          Submit Query & Track Status
        </Button>
      </div>
    </form>
  );
}
