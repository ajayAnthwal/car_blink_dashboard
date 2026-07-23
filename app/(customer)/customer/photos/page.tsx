"use client";

import React, { useState, useEffect } from "react";
import { getBookings } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, X, Loader2 } from "lucide-react";

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

interface Booking {
  _id: string;
  vehicleId: Vehicle;
  serviceId: Service;
  status: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  updatedAt: string;
}

export default function PhotosPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await getBookings();
      const withPhotos = ((Array.isArray(res?.docs) ? res.docs : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])))).filter(
        (b: Booking) => (b.beforePhotos && b.beforePhotos.length > 0) || (b.afterPhotos && b.afterPhotos.length > 0)
      );
      setBookings(withPhotos);
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGallery = (title: string, urls: string[] | undefined) => {
    if (!urls || urls.length === 0) {
      return (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</p>
          <p className="text-sm text-gray-500">No photos uploaded yet.</p>
        </div>
      );
    }
    return (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {urls.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              onClick={() => setLightboxUrl(url)}
              className="aspect-square rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md hover:scale-[1.03] hover:z-10 transition-all duration-300 relative group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${title} photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Before & After Gallery</h2>

      {isLoading ? (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Loading photos...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <ImageIcon className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">
            No service photos yet. Photos uploaded by your service partner will appear here once your job is
            underway.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <Card key={booking._id} className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40 hover:shadow-elevated transition-shadow duration-300">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-bold text-gray-900 text-lg">
                      {booking.vehicleId?.brand} {booking.vehicleId?.model}
                    </h4>
                    <p className="text-sm font-medium text-gray-500">{booking.serviceId?.name}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full border bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20">
                    {booking.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-neutral-muted/20">
                  {renderGallery("Before", booking.beforePhotos)}
                  {renderGallery("After", booking.afterPhotos)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-gray-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-neutral-white hover:text-neutral-bg"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-7 h-7" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Service photo full view"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
