"use client";

import React, { useState, useEffect } from "react";
import { getGarageVehicles, getServices, getCities, createBooking, getBookings, getBookingById, cancelBooking, getBookingQuotes, selectBookingQuote } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { CalendarCheck, X, Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  registrationNumber: string;
}

interface Service {
  _id: string;
  name: string;
}

interface City {
  _id: string;
  name: string;
  state: string;
}

interface Booking {
  _id: string;
  vehicleId: Vehicle;
  serviceId: Service;
  cityId: City;
  description: string;
  preferredDate: string;
  status: string;
  selectedQuote?: any;
  quotes?: any[];
}

interface Quote {
  _id: string;
  partnerId: any;
  amount: number;
  estimatedDays: number;
  status: string;
}

export default function BookingsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  
  const [vehicleId, setVehicleId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState("");

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSelectingQuote, setIsSelectingQuote] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [vehiclesRes, servicesRes, citiesRes, bookingsRes] = await Promise.all([
        getGarageVehicles(),
        getServices(),
        getCities(),
        getBookings(),
      ]);
      setVehicles(vehiclesRes?.docs || vehiclesRes || []);
      setServices(servicesRes?.docs || servicesRes || []);
      setCities(citiesRes?.docs || citiesRes || []);
      setBookings(bookingsRes?.docs || bookingsRes || []);
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await createBooking({
        vehicleId,
        serviceId,
        cityId,
        description,
        preferredDate: new Date(preferredDate).toISOString(),
      });
      setMessage({ type: "success", text: "Booking created successfully!" });
      setVehicleId("");
      setServiceId("");
      setCityId("");
      setDescription("");
      setPreferredDate("");
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to create booking." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (booking: Booking) => {
    setSelectedBooking(booking);
    setQuotes(booking.quotes || []);
    setIsLoadingQuotes(true);
    try {
      const res = await getBookingQuotes(booking._id);
      setQuotes(res?.docs || res || []);
    } catch (err) {
      console.error("Failed to load quotes", err);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason) return;
    setIsCancelling(true);
    try {
      await cancelBooking(selectedBooking._id, { reason: cancelReason });
      setMessage({ type: "success", text: "Booking cancelled successfully!" });
      setSelectedBooking(null);
      setCancelReason("");
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to cancel booking." });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSelectQuote = async () => {
    if (!selectedBooking || !selectedQuoteId) return;
    setIsSelectingQuote(true);
    try {
      await selectBookingQuote(selectedBooking._id, { bidId: selectedQuoteId });
      setMessage({ type: "success", text: "Quote selected successfully!" });
      setSelectedBooking(null);
      setSelectedQuoteId("");
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to select quote." });
    } finally {
      setIsSelectingQuote(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING": return "bg-warning/10 text-warning border-warning/20";
      case "CONFIRMED": return "bg-success/10 text-success border-success/20";
      case "CANCELLED": return "bg-danger/10 text-danger border-danger/20";
      case "COMPLETED": return "bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20";
      default: return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
    }
  };

  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">My Bookings</h2>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === "success" 
            ? "bg-success/10 text-success border-success/20" 
            : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-primary-orange" />
            <span>New Booking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Vehicle"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                options={vehicles.map(v => ({ value: v._id, label: `${v.brand} ${v.model} (${v.registrationNumber})` }))}
                disabled={vehicles.length === 0}
                required
              />
              <Select
                label="Service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                options={services.map(s => ({ value: s._id, label: s.name }))}
                required
              />
              <Select
                label="City"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                options={cities.map(c => ({ value: c._id, label: `${c.name}, ${c.state}` }))}
                required
              />
              <Input
                label="Preferred Date & Time"
                type="datetime-local"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={minDateTime}
                required
              />
              <div className="md:col-span-2">
                <Input
                  label="Description"
                  placeholder="Describe your service requirement"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting} disabled={vehicles.length === 0}>
                Create Booking
              </Button>
            </div>
            {vehicles.length === 0 && (
              <p className="text-xs text-neutral-muted">Please add a vehicle to your garage first.</p>
            )}
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-bold text-primary-navy mb-4">Your Bookings ({bookings.length})</h3>
        {isLoadingData ? (
          <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
            <p className="text-neutral-muted">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
            <CalendarCheck className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
            <p className="text-neutral-muted">No bookings yet. Create your first booking above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-primary-navy">
                          {booking.vehicleId?.brand} {booking.vehicleId?.model}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-muted">{booking.serviceId?.name}</p>
                      <p className="text-sm text-neutral-muted">{booking.cityId?.name}, {booking.cityId?.state}</p>
                      <p className="text-xs text-neutral-muted mt-1">
                        {new Date(booking.preferredDate).toLocaleString()}
                      </p>
                      {booking.selectedQuote && (
                        <p className="text-xs text-success mt-1 font-medium">
                          Quote Selected: ₹{booking.selectedQuote.amount}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="text-sm font-medium text-primary-orange hover:text-primary-orange-dark px-3 py-1.5 rounded-lg hover:bg-neutral-bg transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Booking Details</CardTitle>
              <button
                onClick={() => { setSelectedBooking(null); setQuotes([]); setCancelReason(""); }}
                className="text-neutral-muted hover:text-neutral-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-muted">Vehicle</p>
                  <p className="font-medium">{selectedBooking.vehicleId?.brand} {selectedBooking.vehicleId?.model}</p>
                </div>
                <div>
                  <p className="text-neutral-muted">Service</p>
                  <p className="font-medium">{selectedBooking.serviceId?.name}</p>
                </div>
                <div>
                  <p className="text-neutral-muted">City</p>
                  <p className="font-medium">{selectedBooking.cityId?.name}, {selectedBooking.cityId?.state}</p>
                </div>
                <div>
                  <p className="text-neutral-muted">Preferred Date</p>
                  <p className="font-medium">{new Date(selectedBooking.preferredDate).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-neutral-muted">Description</p>
                  <p className="font-medium">{selectedBooking.description}</p>
                </div>
              </div>

              {selectedBooking.status !== "CANCELLED" && selectedBooking.status !== "COMPLETED" && (
                <div className="border-t border-neutral-muted/20 pt-4">
                  <h4 className="font-semibold text-primary-navy mb-3">Cancel Booking</h4>
                  <div className="flex space-x-3">
                    <Input
                      placeholder="Reason for cancellation"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCancelBooking}
                      isLoading={isCancelling}
                      disabled={!cancelReason}
                      className="border-danger text-danger hover:bg-danger/5"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-muted/20 pt-4">
                <h4 className="font-semibold text-primary-navy mb-3">Quotes</h4>
                {isLoadingQuotes ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
                  </div>
                ) : quotes.length === 0 ? (
                  <p className="text-sm text-neutral-muted">No quotes received yet.</p>
                ) : (
                  <div className="space-y-3">
                    {quotes.map((quote) => (
                      <div
                        key={quote._id}
                        className={`p-4 rounded-xl border ${
                          selectedBooking.selectedQuote?._id === quote._id
                            ? "border-success bg-success/5"
                            : "border-neutral-muted/20 bg-neutral-bg"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-neutral-dark">Partner: {quote.partnerId?.fullName || "Service Partner"}</p>
                            <p className="text-sm text-neutral-muted">Estimated: {quote.estimatedDays} days</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-navy">₹{quote.amount}</p>
                            {selectedBooking.selectedQuote?._id === quote._id && (
                              <span className="text-xs text-success font-medium">Selected</span>
                            )}
                          </div>
                        </div>
                        {selectedBooking.status !== "CANCELLED" && selectedBooking.status !== "COMPLETED" && !selectedBooking.selectedQuote && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => { setSelectedQuoteId(quote._id); handleSelectQuote(); }}
                              isLoading={isSelectingQuote}
                            >
                              <Check className="w-4 h-4 mr-1" /> Select Quote
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
