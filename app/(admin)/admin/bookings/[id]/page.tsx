// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminBookingDetails, useCancelAdminBookingMutation } from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Loader2, Calendar, User, Wrench, ArrowLeft, Ban, 
  MapPin, Clock, FileText, CheckCircle2, Car, IndianRupee,
  Phone, Mail, Info, Camera
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminBookingDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: booking, isLoading } = useAdminBookingDetails(id as string);
  const cancelMutation = useCancelAdminBookingMutation();
  
  const [cancelReason, setCancelReason] = useState("");

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    
    const confirmCancel = window.confirm("Are you sure you want to forcibly cancel this booking? This action cannot be undone.");
    if (!confirmCancel) return;

    try {
      await cancelMutation.mutateAsync({ id: id as string, reason: cancelReason });
      toast.success("Booking cancelled successfully.");
    } catch (error: unknown) {
      toast.error(error?.message || "Failed to cancel booking.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary-navy" />
        <p className="text-gray-500 font-medium tracking-wide">Loading booking details...</p>
      </div>
    );
  }

  if (!booking || Array.isArray(booking)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 mt-6 mx-4">
        <Info className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">Booking not found</h2>
        <p className="text-gray-400 mt-2 max-w-sm">The booking you are looking for does not exist or has been removed from the system.</p>
        <button onClick={() => router.back()} className="mt-6 text-white bg-primary-navy px-6 py-2 rounded-xl font-bold shadow-md hover:bg-indigo-900 transition-colors">Go Back</button>
      </div>
    );
  }

  const isCancellable = !["COMPLETED", "CANCELLED"].includes(booking.status);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-16 p-4">
      {/* Header */}
      <div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </button>

        <div className="bg-gradient-to-r from-primary-navy to-indigo-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between shadow-elevated gap-6">
          <div className="flex items-center gap-5 text-white">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-heading">Booking Overview</h1>
              <p className="text-white/80 mt-1 font-mono text-sm tracking-wide">ID: {booking._id}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg tracking-wider ${
              booking.status === 'COMPLETED' ? 'bg-green-500 text-white' :
              booking.status === 'CANCELLED' ? 'bg-red-500 text-white' :
              booking.status === 'IN_PROGRESS' ? 'bg-blue-500 text-white' :
              'bg-yellow-400 text-yellow-900'
            }`}>
              {booking.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-orange" /> Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5"/> Service Type</p>
                <p className="font-semibold text-gray-900 text-xl">{booking.serviceId?.name || "N/A"}</p>
                <p className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block mt-2 font-medium">{booking.serviceId?.category || "General"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Car className="w-3.5 h-3.5"/> Vehicle Details</p>
                <p className="font-semibold text-gray-900 text-xl">{booking.vehicleId?.model} <span className="text-gray-500 font-medium text-lg">({booking.vehicleId?.year})</span></p>
                <p className="text-sm text-primary-navy font-bold font-mono bg-indigo-50 px-3 py-1 rounded inline-block mt-2 border border-indigo-100 shadow-sm">{booking.vehicleId?.registrationNumber}</p>
              </div>

              <div className="md:col-span-2 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-3">Customer Problem Description</p>
                <p className="text-gray-800 leading-relaxed font-medium">&quot;{booking.description || "No description provided."}&quot;</p>
              </div>

              <div className="flex flex-col gap-2 bg-white border border-gray-100 shadow-sm p-4 rounded-2xl">
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary-orange"/> Preferred Date</p>
                <p className="font-bold text-gray-900">
                  {booking.preferredDate ? new Date(booking.preferredDate).toLocaleString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : "N/A"}
                </p>
              </div>

              <div className="flex flex-col gap-2 bg-white border border-gray-100 shadow-sm p-4 rounded-2xl">
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-500"/> Coordinates</p>
                <p className="font-bold text-gray-900 font-mono text-sm">
                  {booking.location?.coordinates ? `${booking.location.coordinates[1]}, ${booking.location.coordinates[0]}` : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bid / Pricing Information */}
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-600" /> Accepted Bid Details
              </CardTitle>
              {booking.forwardedBidIds?.length > 0 && !booking.acceptedBidId && (
                 <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">
                   Forwarded to {booking.forwardedBidIds.length} partners
                 </span>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {booking.acceptedBidId ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2">Partner / Garage</p>
                    <p className="font-bold text-gray-900 text-lg">{booking.acceptedBidId.partnerId?.businessName}</p>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <User className="w-3.5 h-3.5" /> 
                      {booking.acceptedBidId.partnerId?.userId?.fullName}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2">Quoted Amount</p>
                    <p className="font-black text-green-600 text-3xl">₹{booking.acceptedBidId.quotedAmount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Est. Duration</p>
                    <p className="font-bold text-gray-900 text-lg">{booking.acceptedBidId.estimatedDuration}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2">Bid Status</p>
                    <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm inline-block">{booking.acceptedBidId.status}</span>
                  </div>
                  <div className="sm:col-span-2 bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100 mt-2">
                    <p className="text-[11px] text-indigo-500 uppercase font-bold tracking-wider mb-3">Partner Notes</p>
                    <p className="text-indigo-900 text-sm font-medium">&quot;{booking.acceptedBidId.notes || "No notes provided."}&quot;</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-lg text-gray-500">No bid has been accepted yet.</p>
                  <p className="text-sm mt-2">Waiting for partner responses.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-orange" /> Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2">Service Mode</p>
                <p className="font-bold text-gray-900">{booking.serviceMode?.replace('_', ' ') || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2">Payment Mode</p>
                <p className="font-bold text-gray-900">{booking.paymentMode || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2">Coupon Discount</p>
                <p className="font-bold text-green-600">₹{booking.couponDiscountAmount || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          {(booking.beforePhotos?.length > 0 || booking.afterPhotos?.length > 0) && (
            <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary-orange" /> Work Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {booking.beforePhotos?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div> Before Service
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                      {booking.beforePhotos.map((photo: string, i: number) => (
                        <img key={i} src={photo} alt="Before" className="w-32 h-32 object-cover rounded-xl border border-gray-200 shadow-sm flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                )}
                {booking.afterPhotos?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div> After Service
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                      {booking.afterPhotos.map((photo: string, i: number) => (
                        <img key={i} src={photo} alt="After" className="w-32 h-32 object-cover rounded-xl border border-gray-200 shadow-sm flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200 overflow-hidden">
            <CardHeader className="bg-primary-navy text-white pb-5">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary-orange" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5 pt-6 bg-white">
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-1">Full Name</p>
                <p className="font-bold text-gray-900 text-lg">{booking.customerId?.fullName || "Unknown"}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-sm font-bold text-gray-700">{booking.customerId?.phone || "N/A"}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-sm font-bold text-gray-700 break-all">{booking.customerId?.email || "N/A"}</p>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 mt-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">City</p>
                  <p className="text-sm font-bold text-gray-700">{booking.cityId?.name || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Executive Card */}
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200 overflow-hidden">
            <CardHeader className="bg-gray-50/80 border-b border-gray-100 pb-5">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary-orange" /> Field Executive
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5 bg-white">
              {booking.assignedExecutiveId ? (
                <>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-1">Assigned To</p>
                    <p className="font-bold text-gray-900 text-lg">{booking.assignedExecutiveId.fullName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">{booking.assignedExecutiveId.phone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 break-all">{booking.assignedExecutiveId.email}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm font-bold">Unassigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold uppercase text-[11px] tracking-wider">Created On</span>
                <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                  {new Date(booking.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-4">
                <span className="text-gray-500 font-bold uppercase text-[11px] tracking-wider">Last Updated</span>
                <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                  {new Date(booking.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isCancellable && (
        <Card className="bg-red-50/50 border-red-200 shadow-sm mt-10 overflow-hidden">
          <CardHeader className="bg-red-100/50 border-b border-red-100">
            <CardTitle className="text-red-700 flex items-center gap-2 text-lg font-bold">
              <Ban className="w-5 h-5" /> Admin Override: Force Cancel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <p className="text-sm text-red-600 mb-6 font-medium max-w-2xl">
              Use this action to forcefully cancel a booking if the customer or partner is unable to do so, or in case of an emergency. This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
              <input
                type="text"
                placeholder="Enter detailed reason for cancellation..."
                className="flex-1 px-5 py-3.5 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white shadow-inner"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-red-200 disabled:opacity-50 whitespace-nowrap"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Force Cancel Booking"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {booking.status === 'CANCELLED' && booking.cancellationReason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 md:p-8 text-red-700 flex items-start gap-4 mt-10 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xl mb-1">Booking Cancelled</h3>
            <p className="text-sm font-medium mt-1">Reason: <span className="font-bold">{booking.cancellationReason}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
