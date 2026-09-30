import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Store, Truck, CreditCard, Banknote, MapPin, PenLine, Navigation, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";

const bookingSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  serviceId: z.string().min(1, "Service is required"),
  state: z.string().optional(),
  cityId: z.string().optional(),
  preferredDate: z.string().min(1, "Preferred date is required").refine((val) => {
    const today = new Date().toISOString().split('T')[0];
    return val >= today;
  }, "Past dates cannot be selected for service booking"),
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

export const TIME_SLOTS = [
  { id: "09:00 AM", label: "09:00 AM - 10:00 AM", period: "Morning" },
  { id: "10:00 AM", label: "10:00 AM - 11:00 AM", period: "Morning" },
  { id: "11:00 AM", label: "11:00 AM - 12:00 PM", period: "Morning" },
  { id: "12:00 PM", label: "12:00 PM - 01:00 PM", period: "Afternoon" },
  { id: "01:00 PM", label: "01:00 PM - 02:00 PM", period: "Afternoon" },
  { id: "02:00 PM", label: "02:00 PM - 03:00 PM", period: "Afternoon" },
  { id: "03:00 PM", label: "03:00 PM - 04:00 PM", period: "Afternoon" },
  { id: "04:00 PM", label: "04:00 PM - 05:00 PM", period: "Evening" },
  { id: "05:00 PM", label: "05:00 PM - 06:00 PM", period: "Evening" },
  { id: "06:00 PM", label: "06:00 PM - 07:00 PM", period: "Evening" },
];

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

  const { user } = useAuth();
  const [hasAutoFilled, setHasAutoFilled] = React.useState(false);

  const selectedState = watch("state");
  const selectedServiceMode = watch("serviceMode");
  const selectedPaymentMode = watch("paymentMode");
  const selectedTime = watch("preferredTime");

  // Auto-prefill State, City, and Address from saved profile
  useEffect(() => {
    if (user && !hasAutoFilled) {
      const userState = (user as any).state;
      const userCityId = (user as any).cityId;
      const userAddress = (user as any).address;

      if (userState) {
        setValue("state", userState);
        onStateChange(userState);
      }
      if (userCityId) {
        setValue("cityId", userCityId);
      }
      if (userAddress) {
        setValue("address", userAddress);
      }
      setHasAutoFilled(true);
    }
  }, [user, hasAutoFilled, setValue, onStateChange]);

  useEffect(() => {
    if (selectedState) {
      onStateChange(selectedState);
    }
  }, [selectedState, onStateChange]);

  const handleFormSubmit = (data: BookingFormValues) => {
    const dateTime = new Date(`${data.preferredDate}T${data.preferredTime}`);
    const resolvedCityId = data.cityId || (user as any)?.cityId || (cities.length > 0 ? cities[0]._id : "6a56fe37cd289f213b596a00");
    const submitData = {
      ...data,
      cityId: resolvedCityId,
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

        <div className="pt-4 border-t border-neutral-muted/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1.5 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-primary-orange" />
                Select Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...register("preferredDate")}
                  className="w-full rounded-xl border border-neutral-muted/30 bg-neutral-bg px-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange shadow-sm text-neutral-dark"
                  required
                />
              </div>
              {errors.preferredDate && <p className="text-red-500 text-xs mt-1">{errors.preferredDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1.5 flex items-center justify-between">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-primary-orange" />
                  Select Time Slot *
                </span>
                {selectedTime && (
                  <span className="text-xs font-bold text-primary-orange bg-primary-orange/10 px-2 py-0.5 rounded-md">
                    {selectedTime}
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  value={selectedTime || ""}
                  onChange={(e) => setValue("preferredTime", e.target.value, { shouldValidate: true })}
                  className="w-full rounded-xl border border-neutral-muted/30 bg-neutral-bg px-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange shadow-sm text-neutral-dark cursor-pointer font-medium"
                  required
                >
                  <option value="">-- Choose Preferred Time Slot --</option>
                  <optgroup label="🌅 Morning Slots">
                    {TIME_SLOTS.filter(s => s.period === "Morning").map(s => (
                      <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="☀️ Afternoon Slots">
                    {TIME_SLOTS.filter(s => s.period === "Afternoon").map(s => (
                      <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🌆 Evening Slots">
                    {TIME_SLOTS.filter(s => s.period === "Evening").map(s => (
                      <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              {errors.preferredTime && <p className="text-red-500 text-xs mt-1">{errors.preferredTime.message}</p>}
            </div>
          </div>

          {/* Quick-Pick 1-Click Time Slot Chips */}
          <div className="space-y-2 pt-1 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-dark flex items-center gap-1.5">
                <span className="text-primary-orange">⚡</span> Quick Select Workshop Slot:
              </span>
              <span className="text-[11px] text-gray-500 font-medium">Click to pick time instantly</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot.label || selectedTime === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setValue("preferredTime", slot.label, { shouldValidate: true })}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center gap-0.5",
                      isSelected
                        ? "border-primary-orange bg-primary-orange text-white shadow-sm ring-2 ring-primary-orange/30 scale-[1.02]"
                        : "border-gray-200 bg-white hover:border-primary-orange/50 hover:bg-orange-50/50 text-gray-800"
                    )}
                  >
                    <span className="font-bold">{slot.id}</span>
                    <span className={cn("text-[10px]", isSelected ? "text-orange-100 font-medium" : "text-gray-400 font-normal")}>
                      {slot.period}
                    </span>
                  </button>
                );
              })}
            </div>
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
