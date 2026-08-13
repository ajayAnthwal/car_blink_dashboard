import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Store, Truck, CreditCard, Banknote, MapPin, PenLine, Navigation, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const bookingSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  serviceId: z.string().min(1, "Service is required"),
  state: z.string().optional(),
  cityId: z.string().min(1, "City is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  description: z.string().min(10, "Please provide a description (min 10 chars)"),
  serviceMode: z.enum(["DOORSTEP", "GARAGE_VISIT"]),
  paymentMode: z.enum(["CASH", "ONLINE"]),
  address: z.string().optional(),
  landmark: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.serviceMode === "DOORSTEP" && (!data.address || data.address.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Address is required for doorstep service",
      path: ["address"],
    });
  }
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

interface FormOption {
  _id?: string;
  name?: string;
  value?: string;
  brand?: string;
  model?: string;
  category?: string;
}

interface BookingFormProps {
  vehicles: FormOption[];
  services: FormOption[];
  states: FormOption[];
  cities: FormOption[];
  onStateChange: (state: string) => void;
  onSubmit: (data: BookingFormValues) => void;
  isSubmitting: boolean;
}

export function BookingForm({
  vehicles,
  services,
  states,
  cities,
  onStateChange,
  onSubmit,
  isSubmitting,
}: BookingFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      vehicleId: "",
      serviceId: "",
      state: "",
      cityId: "",
      preferredDate: "",
      preferredTime: "",
      description: "",
      serviceMode: "GARAGE_VISIT",
      paymentMode: "ONLINE",
      address: "",
      landmark: "",
    },
  });

  const selectedState = watch("state");
  const selectedServiceMode = watch("serviceMode");
  const selectedPaymentMode = watch("paymentMode");

  useEffect(() => {
    if (selectedState) {
      onStateChange(selectedState);
      setValue("cityId", "");
    }
  }, [selectedState, onStateChange, setValue]);

  const handleFormSubmit = (data: BookingFormValues) => {
    const dateTime = new Date(`${data.preferredDate}T${data.preferredTime}`);
    const submitData = {
      ...data,
      preferredDate: dateTime.toISOString(),
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* SECTION 1: Service Details */}
      <div className="bg-neutral-white p-4 md:p-6 rounded-2xl shadow-subtle border border-neutral-muted/10 space-y-6">
        <div className="flex items-center space-x-2 border-b border-neutral-muted/10 pb-4">
          <div className="w-8 h-8 rounded-full bg-primary-orange/10 flex items-center justify-center">
            <span className="text-primary-orange font-bold">1</span>
          </div>
          <h3 className="text-lg font-heading font-semibold text-primary-navy">Service Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Select
              label="Select Vehicle"
              value={watch("vehicleId")}
              onChange={(e) => setValue("vehicleId", e.target.value)}
              options={vehicles.map(v => ({ value: v._id || "", label: `${v.brand || ""} ${v.model || ""}` }))}
              required
            />
            {errors.vehicleId && <p className="text-red-500 text-xs mt-1">{errors.vehicleId.message}</p>}
          </div>

          <div>
            <Select
              label="Required Service"
              value={watch("serviceId")}
              onChange={(e) => setValue("serviceId", e.target.value)}
              options={services.map(s => ({ value: s._id || "", label: s.name || "", group: s.category }))}
              required
            />
            {errors.serviceId && <p className="text-red-500 text-xs mt-1">{errors.serviceId.message}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 2: Location & Date */}
      <div className="bg-neutral-white p-4 md:p-6 rounded-2xl shadow-subtle border border-neutral-muted/10 space-y-6">
        <div className="flex items-center space-x-2 border-b border-neutral-muted/10 pb-4">
          <div className="w-8 h-8 rounded-full bg-primary-orange/10 flex items-center justify-center">
            <span className="text-primary-orange font-bold">2</span>
          </div>
          <h3 className="text-lg font-heading font-semibold text-primary-navy">Location & Time</h3>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-neutral-dark">Service Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setValue("serviceMode", "GARAGE_VISIT")}
              className={cn(
                "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                selectedServiceMode === "GARAGE_VISIT" 
                  ? "border-primary-orange bg-primary-orange/5 shadow-sm" 
                  : "border-neutral-muted/20 hover:border-primary-orange/50 hover:bg-neutral-muted/5"
              )}
            >
              <div className={cn("p-3 rounded-full mr-4", selectedServiceMode === "GARAGE_VISIT" ? "bg-primary-orange text-white" : "bg-neutral-muted/20 text-neutral-dark")}>
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-primary-navy">Visit Garage</h4>
                <p className="text-xs text-neutral-muted mt-0.5">Drop your car at our partner garage</p>
              </div>
            </div>

            <div 
              onClick={() => setValue("serviceMode", "DOORSTEP")}
              className={cn(
                "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                selectedServiceMode === "DOORSTEP" 
                  ? "border-primary-orange bg-primary-orange/5 shadow-sm" 
                  : "border-neutral-muted/20 hover:border-primary-orange/50 hover:bg-neutral-muted/5"
              )}
            >
              <div className={cn("p-3 rounded-full mr-4", selectedServiceMode === "DOORSTEP" ? "bg-primary-orange text-white" : "bg-neutral-muted/20 text-neutral-dark")}>
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-primary-navy">Doorstep Service</h4>
                <p className="text-xs text-neutral-muted mt-0.5">Mechanic visits your location</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <Select
              label="State"
              value={watch("state")}
              onChange={(e) => setValue("state", e.target.value)}
              options={states.map(s => ({ value: s.value || s.name || "", label: s.name || "" }))}
              required
            />
          </div>
          <div>
            <Select
              label="City"
              value={watch("cityId")}
              onChange={(e) => setValue("cityId", e.target.value)}
              options={cities.map(c => ({ value: c._id || "", label: c.name || "" }))}
              disabled={!selectedState || cities.length === 0}
              required
            />
            {errors.cityId && <p className="text-red-500 text-xs mt-1">{errors.cityId.message}</p>}
          </div>
        </div>

        {selectedServiceMode === "DOORSTEP" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-bg p-4 rounded-xl border border-neutral-muted/20">
            <div className="md:col-span-2 flex items-center mb-2">
              <MapPin className="w-4 h-4 text-primary-orange mr-2" />
              <h4 className="font-semibold text-sm text-primary-navy">Doorstep Address Details</h4>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Full Address *"
                placeholder="House No, Building, Street..."
                {...register("address")}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Input
                label="Landmark (Optional)"
                placeholder="Near Apollo Hospital..."
                {...register("landmark")}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-muted/10">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1.5 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-primary-orange" />
              Select Date
            </label>
            <div className="relative">
              <input
                type="date"
                {...register("preferredDate")}
                className="w-full rounded-xl border border-neutral-muted/30 bg-neutral-bg px-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange shadow-sm text-neutral-dark"
                required
              />
            </div>
            {errors.preferredDate && <p className="text-red-500 text-xs mt-1">{errors.preferredDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1.5 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-primary-orange" />
              Select Time
            </label>
            <div className="relative">
              <input
                type="time"
                {...register("preferredTime")}
                className="w-full rounded-xl border border-neutral-muted/30 bg-neutral-bg px-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange shadow-sm text-neutral-dark"
                required
              />
            </div>
            {errors.preferredTime && <p className="text-red-500 text-xs mt-1">{errors.preferredTime.message}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 3: Preferences */}
      <div className="bg-neutral-white p-4 md:p-6 rounded-2xl shadow-subtle border border-neutral-muted/10 space-y-6">
        <div className="flex items-center space-x-2 border-b border-neutral-muted/10 pb-4">
          <div className="w-8 h-8 rounded-full bg-primary-orange/10 flex items-center justify-center">
            <span className="text-primary-orange font-bold">3</span>
          </div>
          <h3 className="text-lg font-heading font-semibold text-primary-navy">Preferences</h3>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-neutral-dark">Payment Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setValue("paymentMode", "ONLINE")}
              className={cn(
                "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                selectedPaymentMode === "ONLINE" 
                  ? "border-secondary-blue bg-secondary-blue/5 shadow-sm" 
                  : "border-neutral-muted/20 hover:border-secondary-blue/50 hover:bg-neutral-muted/5"
              )}
            >
              <div className={cn("p-3 rounded-full mr-4", selectedPaymentMode === "ONLINE" ? "bg-secondary-blue text-white" : "bg-neutral-muted/20 text-neutral-dark")}>
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-primary-navy">Pay Online</h4>
                <p className="text-xs text-neutral-muted mt-0.5">Secure payment via Cards/UPI</p>
              </div>
            </div>

            <div 
              onClick={() => setValue("paymentMode", "CASH")}
              className={cn(
                "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                selectedPaymentMode === "CASH" 
                  ? "border-secondary-blue bg-secondary-blue/5 shadow-sm" 
                  : "border-neutral-muted/20 hover:border-secondary-blue/50 hover:bg-neutral-muted/5"
              )}
            >
              <div className={cn("p-3 rounded-full mr-4", selectedPaymentMode === "CASH" ? "bg-secondary-blue text-white" : "bg-neutral-muted/20 text-neutral-dark")}>
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-primary-navy">Cash on Service</h4>
                <p className="text-xs text-neutral-muted mt-0.5">Pay after service completion</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2 flex items-center">
            <PenLine className="w-4 h-4 mr-2 text-neutral-muted" />
            Description of Issue
          </label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Please describe the issue or service requirements in detail (e.g. Engine making noise, AC not cooling)..."
            className="flex w-full rounded-xl border border-neutral-muted/40 bg-neutral-white px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20 resize-none shadow-sm"
            required
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          isLoading={isSubmitting} 
          className="w-full md:w-auto px-8 py-6 text-lg rounded-xl shadow-elevated"
        >
          <Navigation className="w-5 h-5 mr-2" />
          Create Booking Request
        </Button>
      </div>
    </form>
  );
}
