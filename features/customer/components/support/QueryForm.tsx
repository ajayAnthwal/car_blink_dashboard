// @ts-nocheck
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";

const querySchema = z.object({
  category: z.string().optional(),
  bookingId: z.string().min(1, "Please select a booking or vehicle"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  subject: z.string().min(1, "Query Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export type QueryFormValues = z.infer<typeof querySchema>;

interface QueryFormProps {
  bookings: any[];
  onSubmit: (data: QueryFormValues) => void;
  isSubmitting: boolean;
}

export function QueryForm({ bookings = [], onSubmit, isSubmitting }: QueryFormProps) {
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
      bookingId: bookings.length > 0 ? (bookings[0]._id || bookings[0].id) : "",
      priority: "MEDIUM",
      subject: "",
      description: "",
    },
  });

  useEffect(() => {
    if (bookings.length > 0 && !watch("bookingId")) {
      setValue("bookingId", bookings[0]._id || bookings[0].id);
    }
  }, [bookings, watch, setValue]);

  const selectedBookingId = watch("bookingId");

  return (
    <form onSubmit={handleSubmit((data) => {
      onSubmit(data);
      reset({
        category: "General Inquiry",
        bookingId: bookings.length > 0 ? (bookings[0]._id || bookings[0].id) : "",
        priority: "MEDIUM",
        subject: "",
        description: "",
      });
    })} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            label="Select Relevant Booking / Vehicle"
            value={selectedBookingId}
            onChange={(e) => setValue("bookingId", e.target.value)}
            options={bookings.map((b: any) => {
              const vBrand = b.vehicleId?.brand || 'Vehicle';
              const vModel = b.vehicleId?.model || '';
              const vReg = b.vehicleId?.registrationNumber ? `(${b.vehicleId.registrationNumber})` : '';
              const sName = b.serviceId?.name || 'Service Request';
              return {
                value: b._id || b.id,
                label: `${vBrand} ${vModel} ${vReg} — ${sName}`,
              };
            })}
            disabled={bookings.length === 0}
            required
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
            required
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
            required
          />
          {errors.priority && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.priority.message}</p>}
        </div>

        <div className="md:col-span-2">
          <Input
            label="Query Subject / Title"
            placeholder="e.g. Question regarding my recent brake inspection service"
            {...register("subject")}
          />
          {errors.subject && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.subject.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Detailed Description</label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Please describe your question or issue in detail..."
            className="flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.description.message}</p>}
        </div>
      </div>
      
      <div className="flex justify-end pt-2">
        <Button 
          type="submit" 
          isLoading={isSubmitting} 
          disabled={bookings.length === 0}
          className="bg-primary-orange hover:bg-orange-600 text-white font-bold rounded-xl px-8 py-3 text-sm shadow-md"
        >
          Submit Query & Track Status
        </Button>
      </div>
      {bookings.length === 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          ⚠️ You need at least one active or completed service booking to raise a query.
        </p>
      )}
    </form>
  );
}
