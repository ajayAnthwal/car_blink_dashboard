"use client";

import React, { useState } from "react";
import { assignDriverToBooking, pushDriverLocation } from "@/lib/services";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Truck, MapPin, Navigation } from "lucide-react";

export default function LogisticsPage() {
  const { user } = useAuth();
  
  const [bookingId, setBookingId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [simLogisticsId, setSimLogisticsId] = useState("");
  const [simLat, setSimLat] = useState("28.7041");
  const [simLng, setSimLng] = useState("77.1025");
  const [isPushingLocation, setIsPushingLocation] = useState(false);
  const [pushMessage, setPushMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !driverName || !driverPhone) return;

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await assignDriverToBooking({
        bookingId,
        executiveId: user?._id || "60d5ec49f1b2c8b1f8e4e1a1", // fallback id if user object doesn't have _id
        driverName,
        driverPhone
      });

      setMessage({ type: "success", text: "Driver assigned successfully!" });
      setBookingId("");
      setDriverName("");
      setDriverPhone("");
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to assign driver." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePushLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simLogisticsId || !simLat || !simLng) return;

    setIsPushingLocation(true);
    setPushMessage({ type: "", text: "" });

    try {
      await pushDriverLocation(simLogisticsId, {
        lat: parseFloat(simLat),
        lng: parseFloat(simLng)
      });
      setPushMessage({ type: "success", text: "Location pushed successfully!" });
    } catch (err: any) {
      setPushMessage({ type: "error", text: err?.message || "Failed to push location." });
    } finally {
      setIsPushingLocation(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-primary-navy flex items-center">
          <Truck className="w-6 h-6 mr-2 text-primary-orange" /> 
          Logistics Management
        </h2>
        <p className="text-neutral-muted text-sm mt-1">Assign drivers for vehicle pickup and drop-off logistics.</p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle>Assign Driver to Booking</CardTitle>
        </CardHeader>
        <CardContent>
          {message.text && (
            <div className={`p-3 mb-4 rounded-lg text-sm border ${
              message.type === "success" 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-danger/10 text-danger border-danger/20"
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Booking ID"
              placeholder="Enter Booking Object ID"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Driver Name"
                placeholder="E.g. Ramesh Kumar"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
              />
              <Input
                label="Driver Phone"
                placeholder="+91 9876543210"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-primary-orange hover:bg-primary-orange-dark text-white" isLoading={isSubmitting}>
              <MapPin className="w-4 h-4 mr-2" />
              Assign Driver
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-subtle mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-primary-navy" />
            Simulate Driver Location Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pushMessage.text && (
            <div className={`p-3 mb-4 rounded-lg text-sm border ${
              pushMessage.type === "success" 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-danger/10 text-danger border-danger/20"
            }`}>
              {pushMessage.text}
            </div>
          )}

          <form onSubmit={handlePushLocation} className="space-y-4">
            <Input
              label="Logistics Record ID"
              placeholder="Enter Logistics Object ID"
              value={simLogisticsId}
              onChange={(e) => setSimLogisticsId(e.target.value)}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={simLat}
                onChange={(e) => setSimLat(e.target.value)}
                required
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={simLng}
                onChange={(e) => setSimLng(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="outline" className="w-full border-primary-navy text-primary-navy hover:bg-primary-navy/5" isLoading={isPushingLocation}>
              Push GPS Coordinates
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
