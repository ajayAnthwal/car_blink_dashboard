// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Loader2, MapPin, X } from "lucide-react";
import { 
  useCustomerBookings, 
  useGarageVehicles, 
  useServices, 
  useCities, 
  useCreateBooking,
  useCancelBooking,
  useSelectQuote,
  useRespondToExtension,
  useBookingQuotes,
  useInitiatePayment,
  useCustomerLiveTrackingMutation
} from "@/features/customer/hooks/useCustomerQueries";
import { BookingForm, BookingFormValues } from "@/features/customer/components/bookings/BookingForm";
import { BookingDetailsModal } from "@/features/customer/components/bookings/BookingDetailsModal";
import toast from "react-hot-toast";

export default function BookingsPage() {
  const router = useRouter();
  
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  
  const { data: bookingsData, isLoading: isLoadingBookings, refetch: fetchBookingsData } = useCustomerBookings({ page: currentPage, limit });
  const bookings = bookingsData?.bookings || [];
  const totalBookings = bookingsData?.total || 0;
  const totalPages = Math.ceil(totalBookings / limit) || 1;

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
  const cancelBookingMutation = useCancelBooking();
  const selectQuoteMutation = useSelectQuote();
  const respondExtensionMutation = useRespondToExtension();
  const initiatePaymentMutation = useInitiatePayment();
  const liveTrackingMutation = useCustomerLiveTrackingMutation();

  const [formResetKey, setFormResetKey] = useState(0);

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const { data: quotesData, isLoading: isLoadingQuotes } = useBookingQuotes(selectedBooking?._id || null);
  const quotes = quotesData || [];

  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingData, setTrackingData] = useState<any | null>(null);

  const handleCreateBooking = (data: BookingFormValues) => {


    const doCreateBooking = (lat?: number, lng?: number) => {
      createBookingMutation.mutate(
        {
          ...data,
          preferredDate: new Date(data.preferredDate).toISOString(),
          ...(lat && lng ? { latitude: lat, longitude: lng } : {})
        },
        {
          onSuccess: () => {
            toast.success("Booking created successfully!");
            setFormResetKey(prev => prev + 1);
            fetchBookingsData();
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

  const handleViewDetails = async (booking: any) => {
    setSelectedBooking(booking);
  };

  const handleCancelBooking = (reason: string) => {
    if (!selectedBooking) return;
    
    cancelBookingMutation.mutate(
      { id: selectedBooking._id, reason },
      {
        onSuccess: () => {
          toast.success("Booking cancelled successfully!");
          setSelectedBooking(null);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to cancel booking.");
        }
      }
    );
  };

  const handleSelectQuote = (quoteId: string) => {
    if (!selectedBooking) return;
    
    selectQuoteMutation.mutate(
      { bookingId: selectedBooking._id, bidId: quoteId },
      {
        onSuccess: () => {
          toast.success("Quote selected successfully!");
          setSelectedBooking(null);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to select quote.");
        }
      }
    );
  };

  const handleRespondExtension = (extId: string, status: "APPROVED" | "REJECTED") => {
    if (!selectedBooking) return;
    
    respondExtensionMutation.mutate(
      { bookingId: selectedBooking._id, extId, status },
      {
        onSuccess: () => {
          toast.success(`Extension ${status.toLowerCase()} successfully.`);
          setSelectedBooking(null);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to respond to extension.");
        }
      }
    );
  };

  const handlePayExtension = async (ext: any) => {
    if (!selectedBooking) return;
    try {
      const res = await initiatePaymentMutation.mutateAsync({
        bookingId: selectedBooking._id,
        amount: ext.cost,
        paymentType: "EXTENSION",
        extensionId: ext._id
      } as any);
      if (res && res.clientSecret) {
        toast.success("Payment initiated successfully.");
      } else {
        toast.error("Failed to initiate payment.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to process payment.");
    }
  };

  const handleTrackBooking = async (bookingId: string) => {
    try {
      const res = await liveTrackingMutation.mutateAsync(bookingId);
      setTrackingData(res?.data || res);
      setIsTrackingModalOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Tracking not available yet.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-warning/10 text-warning border-warning/20';
      case 'ACCEPTED': return 'bg-success/10 text-success border-success/20';
      case 'ASSIGNED': return 'bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20';
      case 'IN_PROGRESS': return 'bg-primary-navy/10 text-primary-navy border-primary-navy/20';
      case 'COMPLETED': return 'bg-success/10 text-success border-success/20';
      case 'CANCELLED': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 container mx-auto px-4 sm:px-6 md:px-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Bookings</h2>
          <p className="text-gray-500 mt-1">Manage your service appointments.</p>
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-primary-navy/10 p-2 rounded-xl text-primary-navy">
              <Calendar className="w-5 h-5" />
            </div>
            <span>New Booking Request</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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

      <div>
        <h3 className="text-2xl font-bold text-gray-900 font-heading tracking-tight mb-5">Your Bookings</h3>
        
        {isLoadingBookings ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-heading mb-2">No Bookings Found</h3>
            <p className="text-gray-500 font-medium max-w-sm mb-6">You don&apos;t have any service bookings yet. Create one above to get started!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-subtle border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-500">
                    <th className="py-4 px-6 uppercase tracking-wider">Service</th>
                    <th className="py-4 px-6 uppercase tracking-wider">Vehicle</th>
                    <th className="py-4 px-6 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking: any) => (
                    <tr 
                      key={booking._id} 
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="font-heading font-bold text-gray-900">{booking.serviceId?.name || "Service"}</p>
                        {booking.cityId && (
                          <div className="flex items-center text-xs text-neutral-muted mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {booking.cityId.name}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900">{booking.vehicleId?.brand} {booking.vehicleId?.model}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-600">
                          {new Date(booking.preferredDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {(booking.status === "ASSIGNED" || booking.status === "IN_PROGRESS") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTrackBooking(booking._id)}
                              className="text-primary-navy border-primary-navy hover:bg-primary-navy/5 h-8 px-2"
                              title="Track Live"
                            >
                              <MapPin className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleViewDetails(booking)}
                            className="bg-primary-orange hover:bg-primary-orange-dark text-white h-8"
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-neutral-muted/10 bg-neutral-bg/30">
                <p className="text-sm text-neutral-muted">
                  Showing page <span className="font-bold text-primary-navy">{currentPage}</span> of <span className="font-bold text-primary-navy">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="border-neutral-muted/20"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="border-neutral-muted/20"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        quotes={quotes}
        isLoadingQuotes={isLoadingQuotes}
        onClose={() => setSelectedBooking(null)}
        onCancelBooking={handleCancelBooking}
        isCancelling={cancelBookingMutation.isPending}
        onSelectQuote={handleSelectQuote}
        isSelectingQuote={selectQuoteMutation.isPending}
        onRespondExtension={handleRespondExtension}
        isExtensionProcessing={respondExtensionMutation.isPending}
        onPayExtension={handlePayExtension}
      />

      {isTrackingModalOpen && trackingData && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white border-white shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle className="font-heading text-lg tracking-tight flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-navy" /> Live Tracking
              </CardTitle>
              <button
                onClick={() => setIsTrackingModalOpen(false)}
                className="text-neutral-muted hover:text-neutral-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-sm">
              <div>
                <p className="text-gray-500">Driver Assigned</p>
                <p className="font-bold text-gray-900">{trackingData.driverName || "Waiting for driver..."}</p>
                {trackingData.driverPhone && <p className="text-gray-600">{trackingData.driverPhone}</p>}
              </div>
              <div>
                <p className="text-gray-500">Current Status</p>
                <p className="font-bold text-primary-orange">{trackingData.status || "N/A"}</p>
              </div>
              {trackingData.currentLocation && (
                <div>
                  <p className="text-gray-500">Last Known Coordinates</p>
                  <p className="font-medium text-gray-900">Lat: {trackingData.currentLocation.lat}, Lng: {trackingData.currentLocation.lng}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Updated at: {new Date(trackingData.currentLocation.lastUpdatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
