"use client";

import React, { useState, useEffect } from "react";
import { getGarageVehicles, getServices, getCities, createBooking, getBookings, getBookingById, cancelBooking, getBookingQuotes, selectBookingQuote, getCustomerLiveTracking, respondToJobExtension } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarCheck, X, Check, ChevronDown, ChevronUp, Loader2, MapPin, AlertCircle } from "lucide-react";
import { State, City as CountryCity } from "country-state-city";

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
  jobExtensions?: any[];
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
  const [selectedStateIso, setSelectedStateIso] = useState("");
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

  const [trackingData, setTrackingData] = useState<any>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isExtensionProcessing, setIsExtensionProcessing] = useState(false);

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
      setVehicles(Array.isArray(vehiclesRes?.docs) ? vehiclesRes.docs : (Array.isArray(vehiclesRes?.vehicles) ? vehiclesRes.vehicles : (Array.isArray(vehiclesRes?.data?.vehicles) ? vehiclesRes.data.vehicles : (Array.isArray(vehiclesRes?.data) ? vehiclesRes.data : (Array.isArray(vehiclesRes) ? vehiclesRes : [])))));
      setServices(Array.isArray(servicesRes?.docs) ? servicesRes.docs : (Array.isArray(servicesRes?.services) ? servicesRes.services : (Array.isArray(servicesRes?.data?.services) ? servicesRes.data.services : (Array.isArray(servicesRes?.data) ? servicesRes.data : (Array.isArray(servicesRes) ? servicesRes : [])))));
      setCities(Array.isArray(citiesRes?.docs) ? citiesRes.docs : (Array.isArray(citiesRes?.cities) ? citiesRes.cities : (Array.isArray(citiesRes?.data?.cities) ? citiesRes.data.cities : (Array.isArray(citiesRes?.data) ? citiesRes.data : (Array.isArray(citiesRes) ? citiesRes : [])))));
      setBookings(Array.isArray(bookingsRes?.docs) ? bookingsRes.docs : (Array.isArray(bookingsRes?.bookings) ? bookingsRes.bookings : (Array.isArray(bookingsRes?.data?.bookings) ? bookingsRes.data.bookings : (Array.isArray(bookingsRes?.data) ? bookingsRes.data : (Array.isArray(bookingsRes) ? bookingsRes : [])))));
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
      setSelectedStateIso("");
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
      setQuotes((Array.isArray(res?.docs) ? res.docs : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))));
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

  const handleTrackBooking = async (bookingId: string) => {
    try {
      const res = await getCustomerLiveTracking(bookingId);
      setTrackingData(res?.data || res);
      setIsTrackingModalOpen(true);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Tracking not available yet." });
    }
  };

  const handleExtensionResponse = async (extId: string, status: "APPROVED" | "REJECTED") => {
    if (!selectedBooking) return;
    setIsExtensionProcessing(true);
    try {
      await respondToJobExtension(selectedBooking._id, extId, { status });
      setMessage({ type: "success", text: `Extension ${status.toLowerCase()} successfully.` });
      fetchInitialData();
      setSelectedBooking(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to respond to extension." });
    } finally {
      setIsExtensionProcessing(false);
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
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">My Bookings</h2>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${message.type === "success"
          ? "bg-success/10 text-success border-success/20"
          : "bg-danger/10 text-danger border-danger/20"
          }`}>
          {message.text}
        </div>
      )}

      <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-orange-50 p-2 rounded-xl text-primary-orange">
              <CalendarCheck className="w-5 h-5" />
            </div>
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
                label="State"
                value={selectedStateIso}
                onChange={(e) => {
                  setSelectedStateIso(e.target.value);
                  setCityId("");
                }}
                options={State.getStatesOfCountry("IN").map(s => ({ value: s.isoCode, label: s.name }))}
                required
              />
              <Select
                label="City"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                options={
                  selectedStateIso
                    ? CountryCity.getCitiesOfState("IN", selectedStateIso).map(c => ({ value: c.name, label: c.name }))
                    : []
                }
                disabled={!selectedStateIso}
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
        <h3 className="text-2xl font-bold text-gray-900 font-heading tracking-tight mb-5">Your Bookings ({bookings.length})</h3>
        {isLoadingData ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <CalendarCheck className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No bookings yet. Create your first booking above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking._id} className="bg-white/90 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-heading font-bold text-gray-900 text-lg">
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
                    <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0">
                      {booking.status !== "PENDING" && booking.status !== "CANCELLED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrackBooking(booking._id)}
                          className="text-primary-navy border-primary-navy hover:bg-primary-navy/5"
                        >
                          <MapPin className="w-4 h-4 mr-1" /> Track Live
                        </Button>
                      )}
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-white/40 shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle className="font-heading text-xl tracking-tight">Booking Details</CardTitle>
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

              {/* Job Extensions Section */}
              {selectedBooking.jobExtensions && selectedBooking.jobExtensions.length > 0 && (
                <div className="border-t border-neutral-muted/20 pt-4">
                  <h4 className="font-semibold text-primary-navy mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-warning" /> Extension Requests
                  </h4>
                  <div className="space-y-3">
                    {selectedBooking.jobExtensions.map((ext: any) => (
                      <div key={ext._id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900">{ext.partName}</p>
                            <p className="text-sm text-gray-600">{ext.reason}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary-navy">₹{ext.cost}</p>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${ext.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              ext.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                              {ext.status}
                            </span>
                          </div>
                        </div>
                        {ext.status === 'PENDING' && (
                          <div className="flex space-x-2 mt-3 justify-end">
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleExtensionResponse(ext._id, 'REJECTED')} disabled={isExtensionProcessing}>
                              Reject
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleExtensionResponse(ext._id, 'APPROVED')} isLoading={isExtensionProcessing}>
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
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
                        className={`p-4 rounded-xl border ${selectedBooking.selectedQuote?._id === quote._id
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
      {isTrackingModalOpen && trackingData && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
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
