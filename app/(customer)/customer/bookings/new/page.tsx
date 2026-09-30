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
      let combinedDate = new Date(data.preferredDate);
      if (data.preferredTime) {
        const timeMatch = data.preferredTime.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const modifier = timeMatch[3]?.toUpperCase();
          if (modifier === "PM" && hours < 12) hours += 12;
          if (modifier === "AM" && hours === 12) hours = 0;
          combinedDate.setHours(hours, minutes, 0, 0);
        }
      }

      createBookingMutation.mutate(
        {
          ...data,
          preferredDate: isNaN(combinedDate.getTime()) ? new Date(data.preferredDate).toISOString() : combinedDate.toISOString(),
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
          {vehicles.length === 0 ? (
            <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 p-8 sm:p-10 rounded-2xl border-2 border-dashed border-amber-300 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center shadow-sm">
                <Car className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-xl font-bold text-gray-900 font-heading">No Vehicles Found in Garage</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You need to add at least one vehicle to your garage before creating a service booking.
                </p>
              </div>
              <Button asChild className="bg-primary-orange hover:bg-primary-orange-dark text-white rounded-xl px-6 py-6 font-bold shadow-md text-base">
                <Link href="/customer/garage">
                  + Add Vehicle to Garage First
                </Link>
              </Button>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
