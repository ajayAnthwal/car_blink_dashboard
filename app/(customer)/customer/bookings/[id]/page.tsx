"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBookingById, getBookingQuotes, selectBookingQuote, cancelBooking } from "@/lib/services";
import { useSocket } from "@/lib/SocketContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Calendar, MapPin, Car, IndianRupee, Clock, CheckCircle2, AlertCircle, Phone, Mail } from "lucide-react";
import { format } from "date-fns";

export default function CustomerBookingDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { socket } = useSocket();
  
  const [booking, setBooking] = useState<any | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (id) {
      fetchBookingDetails();
      fetchQuotes();
    }
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    
    const handleUpdate = (payload: any) => {
      // If payload booking ID matches, refresh data
      if (payload?.bookingId === id || payload?._id === id) {
        fetchBookingDetails();
        fetchQuotes();
      } else {
        // Fallback refresh just in case
        fetchBookingDetails();
        fetchQuotes();
      }
    };

    socket.on("booking_updated", handleUpdate);
    socket.on("quote_received", handleUpdate);
    socket.on("booking_confirmed", handleUpdate);
    socket.on("booking_status_update", handleUpdate);

    return () => {
      socket.off("booking_updated", handleUpdate);
      socket.off("quote_received", handleUpdate);
      socket.off("booking_confirmed", handleUpdate);
      socket.off("booking_status_update", handleUpdate);
    };
  }, [socket, id]);

  const fetchBookingDetails = async () => {
    try {
      const res = await getBookingById(id);
      
      // The API response might be wrapped.
      // Note: lib/axios.ts has a 'MAGIC FIX' that adds a .data property pointing to the first array it finds.
      // If res already has _id, it's the unwrapped booking object.
      let actualBooking;
      if (res?._id) {
        actualBooking = res;
      } else if (res?.data?._id) {
        actualBooking = res.data;
      } else {
        actualBooking = res?.data?.booking || res?.data?.data || res?.data || res;
      }
      setBooking(actualBooking);
    } catch (err) {
      console.error("Failed to load booking details", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const res = await getBookingQuotes(id);
      const quotesArray = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setQuotes(quotesArray);
    } catch (err) {
      console.error("Failed to load quotes", err);
    }
  };

  const handleSelectQuote = async (bidId: string) => {
    setIsAccepting(bidId);
    setMessage({ type: "", text: "" });
    try {
      await selectBookingQuote(id, { bidId });
      setMessage({ type: "success", text: "Quote accepted successfully! Your booking is now assigned." });
      await fetchBookingDetails();
      await fetchQuotes();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to accept quote" });
    } finally {
      setIsAccepting(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      setMessage({ type: "error", text: "Please provide a reason for cancellation" });
      return;
    }
    setIsCancelling(true);
    setMessage({ type: "", text: "" });
    try {
      await cancelBooking(id, { reason: cancelReason });
      setMessage({ type: "success", text: "Booking cancelled successfully" });
      setShowCancel(false);
      await fetchBookingDetails();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to cancel booking" });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'PENDING':
        return <Badge className="bg-primary-navy text-white">Pending</Badge>;
      case 'QUOTED':
        return <Badge className="bg-primary-orange text-white">Quotes Available</Badge>;
      case 'ASSIGNED':
        return <Badge className="bg-secondary-blue text-white">Assigned</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-500 text-white">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-success text-white">Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-danger text-white">Cancelled</Badge>;
      default:
        return <Badge className="bg-neutral-muted text-white">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-2xl border border-neutral-muted/20">
        <AlertCircle className="w-12 h-12 text-neutral-muted/40 mb-4" />
        <h2 className="text-xl font-bold text-primary-navy mb-2">Booking Not Found</h2>
        <p className="text-neutral-muted mb-6">The booking you are looking for does not exist or you don't have access.</p>
        <Button onClick={() => router.push('/customer/bookings')} variant="outline">
          Back to Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 text-neutral-muted hover:text-primary-navy">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl font-bold text-primary-navy">Booking Details</h1>
              {getStatusBadge(booking.status)}
            </div>
            <p className="text-xs text-neutral-muted font-mono tracking-wider">ID: {booking._id || booking.id}</p>
          </div>
        </div>
        
        {/* Actions */}
        {(booking.status === 'PENDING' || booking.status === 'QUOTED') && !showCancel && (
          <Button variant="outline" className="text-danger border-danger/20 hover:bg-danger/10" onClick={() => setShowCancel(true)}>
            Cancel Booking
          </Button>
        )}
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.type === "success" 
            ? "bg-success/10 text-success border-success/20" 
            : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {message.text}
        </div>
      )}

      {showCancel && (
        <Card className="border-danger/20 shadow-md">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-danger mb-3">Cancel Booking</h3>
            <p className="text-sm text-neutral-dark mb-4">Are you sure you want to cancel this booking? This action cannot be undone.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please tell us why you are cancelling..."
              className="w-full p-3 border border-neutral-muted/30 rounded-lg focus:ring-2 focus:ring-danger/20 focus:border-danger outline-none text-sm mb-4"
              rows={3}
            />
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowCancel(false)} disabled={isCancelling}>
                Keep Booking
              </Button>
              <Button className="bg-danger hover:bg-danger/90 text-white" onClick={handleCancelBooking} isLoading={isCancelling}>
                Confirm Cancellation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-neutral-muted/10 overflow-hidden">
            <div className="bg-primary-navy/5 px-6 py-4 border-b border-neutral-muted/10">
              <h2 className="text-lg font-bold text-primary-navy">{booking.serviceId?.name || "Service Request"}</h2>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-3">Vehicle Details</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-blue/10 flex items-center justify-center">
                      <Car className="w-5 h-5 text-secondary-blue" />
                    </div>
                    <div>
                      <p className="font-bold text-primary-navy">
                        {typeof booking.vehicleId === 'object' 
                          ? `${booking.vehicleId?.brand || 'Unknown'} ${booking.vehicleId?.model || 'Vehicle'}`
                          : "Vehicle Requested"
                        }
                      </p>
                      <p className="text-sm text-neutral-muted">
                        {typeof booking.vehicleId === 'object' 
                          ? `${booking.vehicleId?.registrationNumber || 'N/A'} • ${booking.vehicleId?.fuelType || 'N/A'}`
                          : "Details not available"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-3">Schedule & Location</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-neutral-dark">
                      <Calendar className="w-4 h-4 mr-2 text-primary-orange" />
                      <span className="font-medium">
                        {booking.preferredDate && !isNaN(new Date(booking.preferredDate).getTime()) 
                          ? format(new Date(booking.preferredDate), 'PPP') 
                          : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-neutral-dark">
                      <MapPin className="w-4 h-4 mr-2 text-primary-orange" />
                      <span className="font-medium">
                        {typeof booking.cityId === 'object' ? booking.cityId?.name : "Location not provided"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {booking.description && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-neutral-dark bg-neutral-bg p-4 rounded-lg">{booking.description}</p>
                </div>
              )}

              {/* Service Photos Section */}
              {booking.jobDetails && (booking.jobDetails.beforePhotos?.length > 0 || booking.jobDetails.afterPhotos?.length > 0) && (
                <div className="pt-4 border-t border-neutral-muted/10">
                  <h4 className="text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-4">Service Photos</h4>
                  <div className="space-y-6">
                    {booking.jobDetails.beforePhotos?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-primary-navy mb-3 flex items-center">
                          <span className="w-2 h-2 rounded-full bg-warning mr-2"></span> Before Service
                        </h5>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {booking.jobDetails.beforePhotos.map((url: string, index: number) => (
                            <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border border-neutral-muted/20 hover:opacity-90 transition-opacity">
                              <img src={url} alt={`Before ${index + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {booking.jobDetails.afterPhotos?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-primary-navy mb-3 flex items-center">
                          <span className="w-2 h-2 rounded-full bg-success mr-2"></span> After Service
                        </h5>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {booking.jobDetails.afterPhotos.map((url: string, index: number) => (
                            <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border border-neutral-muted/20 hover:opacity-90 transition-opacity">
                              <img src={url} alt={`After ${index + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forwarded Quotes Section */}
          {(booking.status === 'PENDING' || booking.status === 'QUOTED') && quotes.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-primary-navy mb-4 flex items-center">
                <IndianRupee className="w-5 h-5 mr-2 text-secondary-blue" />
                Available Quotes ({quotes.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quotes.map((quote: any) => (
                  <Card key={quote._id} className="border-secondary-blue/20 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                    <div className="bg-secondary-blue/5 p-4 border-b border-secondary-blue/10 flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-primary-navy">{quote.partnerId?.businessName || "Partner"}</h4>
                        <div className="flex items-center text-xs text-neutral-muted mt-1">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-success" /> Verified Partner
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary-orange">₹{quote.quotedAmount}</span>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-4">
                      {quote.estimatedDuration && (
                        <div className="flex items-center text-sm text-neutral-dark">
                          <Clock className="w-4 h-4 mr-2 text-neutral-muted" />
                          <span>Estimated Time: <span className="font-medium">{quote.estimatedDuration}</span></span>
                        </div>
                      )}
                      
                      {quote.notes && (
                        <div className="bg-neutral-bg p-3 rounded-lg text-xs text-neutral-dark border border-neutral-muted/10">
                          {quote.notes}
                        </div>
                      )}

                      <Button 
                        className="w-full bg-secondary-blue hover:bg-secondary-blue/90"
                        onClick={() => handleSelectQuote(quote._id)}
                        isLoading={isAccepting === quote._id}
                        disabled={isAccepting !== null && isAccepting !== quote._id}
                      >
                        Accept Quote
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {booking.status === 'PENDING' && quotes.length === 0 && (
            <Card className="border-neutral-muted/20 border-dashed bg-neutral-white shadow-none">
              <CardContent className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-neutral-muted/50 mx-auto mb-3 animate-spin" />
                <h3 className="text-lg font-bold text-primary-navy mb-1">Waiting for Quotes</h3>
                <p className="text-sm text-neutral-muted">Our service partners are reviewing your request. We will notify you once quotes are available.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Support & Summary */}
        <div className="space-y-6">
          {booking.status === 'ASSIGNED' && booking.assignedPartnerId && (
            <Card className="shadow-sm border-success/20 overflow-hidden">
              <div className="bg-success/10 px-5 py-3 border-b border-success/20">
                <h3 className="font-bold text-success-dark flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Partner Assigned
                </h3>
              </div>
              <CardContent className="p-5">
                <div className="mb-4">
                  <p className="text-xs text-neutral-muted uppercase tracking-wider mb-1">Service Provider</p>
                  <p className="font-bold text-primary-navy text-lg">{booking.assignedPartnerId.businessName || "Service Partner"}</p>
                </div>
                {booking.assignedPartnerId.phone && (
                  <div className="flex items-center text-sm text-neutral-dark mb-2 bg-neutral-bg p-2.5 rounded-lg border border-neutral-muted/10">
                    <Phone className="w-4 h-4 mr-3 text-secondary-blue" />
                    {booking.assignedPartnerId.phone}
                  </div>
                )}
                {booking.assignedPartnerId.email && (
                  <div className="flex items-center text-sm text-neutral-dark bg-neutral-bg p-2.5 rounded-lg border border-neutral-muted/10">
                    <Mail className="w-4 h-4 mr-3 text-secondary-blue" />
                    {booking.assignedPartnerId.email}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-neutral-muted/10 bg-primary-navy/5">
            <CardContent className="p-5">
              <h3 className="font-bold text-primary-navy mb-3">Need Help?</h3>
              <p className="text-sm text-neutral-dark mb-4">If you have any questions or need to make changes to your booking, please contact support.</p>
              <Button variant="outline" className="w-full bg-white border-primary-navy/20 hover:bg-white/80" onClick={() => router.push('/customer/support')}>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
