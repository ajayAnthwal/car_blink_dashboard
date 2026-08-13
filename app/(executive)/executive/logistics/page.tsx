// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useExecutiveLeads, useAssignDriverMutation, usePushLocationMutation } from "@/features/executive/hooks/useExecutiveQueries";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Truck, Navigation } from "lucide-react";

export default function LogisticsPage() {
  const { user } = useAuth();
  
  const [bookingId, setBookingId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  
  const { data: bookingsData, isLoading: isLoadingBookings } = useExecutiveLeads({ page: 1, limit: 100, status: "PENDING,QUOTED,ACCEPTED,IN_PROGRESS" });
  const availableBookings = (bookingsData?.leads || []) as unknown[];

  const assignMutation = useAssignDriverMutation();
  const pushLocationMutation = usePushLocationMutation();

  const [message, setMessage] = useState({ type: "", text: "" });

  const [simLogisticsId, setSimLogisticsId] = useState("");
  const [simLat, setSimLat] = useState("28.7041");
  const [simLng, setSimLng] = useState("77.1025");
  const [pushMessage, setPushMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !driverName || !driverPhone) return;

    setMessage({ type: "", text: "" });

    try {
      const result = await assignMutation.mutateAsync({
        bookingId,
        executiveId: user?._id || "60d5ec49f1b2c8b1f8e4e1a1", // fallback id if user object doesn't have _id
        driverName,
        driverPhone
      });

      setMessage({ type: "success", text: "Driver assigned successfully!" });
      
      // The API returns the created document directly if unwrapped, or inside result.data
      const logisticsId = result?.data?._id || result?._id;
      if (logisticsId) {
        setSimLogisticsId(logisticsId);
      }

      setBookingId("");
      setDriverName("");
      setDriverPhone("");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to assign driver." });
    }
  };

  const handlePushLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simLogisticsId || !simLat || !simLng) return;

    setPushMessage({ type: "", text: "" });

    try {
      await pushLocationMutation.mutateAsync({
        id: simLogisticsId, 
        data: {
          lat: parseFloat(simLat),
          lng: parseFloat(simLng)
        }
      });
      setPushMessage({ type: "success", text: "Location pushed successfully!" });
    } catch (err: unknown) {
      setPushMessage({ type: "error", text: err?.message || "Failed to push location." });
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
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1.5">Select Booking</label>
              <select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                required
                className="flex w-full rounded-lg border border-neutral-muted/40 bg-neutral-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
                disabled={isLoadingBookings}
              >
                <option value="">{isLoadingBookings ? "Loading bookings..." : "-- Select a Booking --"}</option>
                {availableBookings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.serviceId?.name || "Service"} ({b.vehicleId?.make} {b.vehicleId?.model}) - {b.status} - {b.customerId?.fullName}
                  </option>
                ))}
              </select>
            </div>
            
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

            <Button type="submit" className="w-full bg-primary-orange hover:bg-orange-600 text-white" isLoading={assignMutation.isPending}>
              Confirm Assignment
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

            <Button type="submit" className="w-full" isLoading={pushLocationMutation.isPending}>
              Push Driver Location
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
