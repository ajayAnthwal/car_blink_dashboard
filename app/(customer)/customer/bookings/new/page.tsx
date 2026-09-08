// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, ArrowLeft, Car, CheckCircle2 } from "lucide-react";
import { 
  useGarageVehicles, 
  useServices, 
  useCities, 
  useCreateBooking 
} from "@/features/customer/hooks/useCustomerQueries";
import { BookingForm, BookingFormValues } from "@/features/customer/components/bookings/BookingForm";
import toast from "react-hot-toast";

export default function NewBookingPage() {
  const router = useRouter();

  const { data: vehiclesData } = useGarageVehicles();
  const { data: servicesData } = useServices();
  const { data: citiesData } = useCities();
  
  const vehicles = (vehiclesData?.docs || vehiclesData?.data || vehiclesData || []);
  const services = (servicesData?.services || servicesData || []).filter((s: any) => 
    s.category && 
    s.category.toLowerCase() !== 'admin' && 
    s.category.toLowerCase() !== 'other' &&
    s.name !== 'Unique Test Service Category'
  );
  const states = Array.from(new Set((citiesData || []).map((c: any) => c.state))).filter(Boolean).map((s: any) => ({ name: s, value: s }));
  
  const [selectedState, setSelectedState] = useState("");
  const filteredCities = (citiesData || []).filter((c: any) => c.state === selectedState);

  const createBookingMutation = useCreateBooking();
  const [formResetKey, setFormResetKey] = useState(0);

  const handleCreateBooking = (data: BookingFormValues) => {
    const doCreateBooking = (lat?: number, lng?: number) => {
      createBookingMutation.mutate(
        {
          ...data,
          preferredDate: new Date(data.preferredDate).toISOString(),
          ...(lat && lng ? { latitude: lat, longitude: lng } : {})
        },
        {
          onSuccess: (res: any) => {
            const newBookingId = res?.data?._id || res?._id || res?.data?.id;
            toast.success("Booking request created successfully!");
            if (newBookingId) {
              router.push(`/customer/bookings/${newBookingId}`);
            } else {
              router.push("/customer/bookings");
            }
          },
          onError: (err: any) => {
            toast.error(err?.message || "Failed to create booking.");
          }
        }
      );
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          doCreateBooking(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation failed", error);
          doCreateBooking();
        },
        { timeout: 8000 }
      );
    } else {
      doCreateBooking();
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 container mx-auto px-4 sm:px-6 md:px-8 pb-12">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">New Booking Request</h2>
          <p className="text-gray-500 mt-1">Select your service and vehicle to request instant workshop quotes.</p>
        </div>
        <Button asChild variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold rounded-xl text-xs h-10">
          <Link href="/customer/bookings">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Your Bookings
          </Link>
        </Button>
      </div>

      {/* Booking Form Card */}
      <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-gray-100 rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary-navy/5 via-primary-blue/5 to-transparent p-6 border-b border-gray-100">
          <CardTitle className="flex items-center space-x-3 text-xl text-gray-900 font-heading">
            <div className="bg-primary-navy p-2.5 rounded-xl text-white shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <span>Service Request Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <BookingForm 
            key={formResetKey}
            vehicles={vehicles}
            services={services}
            states={states}
            cities={filteredCities}
            onStateChange={setSelectedState}
            onSubmit={handleCreateBooking}
            isSubmitting={createBookingMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
