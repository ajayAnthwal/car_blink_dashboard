"use client";

import React, { useState, useEffect } from "react";
import { getBookings } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/Card";
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
      const withPhotos = (res?.docs || res || []).filter(
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
          <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wide mb-2">{title}</p>
          <p className="text-sm text-neutral-muted">No photos uploaded yet.</p>
        </div>
      );
    }
    return (
      <div>
        <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wide mb-2">{title}</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {urls.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              onClick={() => setLightboxUrl(url)}
              className="aspect-square rounded-xl overflow-hidden border border-neutral-muted/20 hover:opacity-90 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${title} photo ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">Before / After Photos</h2>

      {isLoading ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
          <p className="text-neutral-muted">Loading photos...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <ImageIcon className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
          <p className="text-neutral-muted">
            No service photos yet. Photos uploaded by your service partner will appear here once your job is
            underway.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking._id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-primary-navy">
                      {booking.vehicleId?.brand} {booking.vehicleId?.model}
                    </h4>
                    <p className="text-sm text-neutral-muted">{booking.serviceId?.name}</p>
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
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
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
