"use client";

import React, { useState, useEffect } from "react";
import { getGarageVehicles, requestRSA } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, Navigation, MapPin } from "lucide-react";

export default function RSAPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [issueType, setIssueType] = useState("");
  const [location, setLocation] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await getGarageVehicles();
      const docs = Array.isArray(res?.docs) ? res.docs : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      setVehicles(docs);
    } catch (err) {
      console.error("Failed to load vehicles", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
          setMessage({ type: "success", text: "Location detected successfully." });
        },
        () => {
          setMessage({ type: "error", text: "Failed to detect location. Please enter manually." });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      if (!selectedVehicle || !issueType || !location) {
        throw new Error("Please fill all required fields");
      }

      // Basic parsing of location if it's lat,lng
      let lat = 0;
      let lng = 0;
      if (location.includes(",")) {
        const parts = location.split(",");
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      } else {
        // Mock coordinates for generic address
        lat = 28.6139;
        lng = 77.2090;
      }

      await requestRSA({
        vehicleId: selectedVehicle,
        issueType,
        location: { lat, lng }
      });

      setMessage({ type: "success", text: "Emergency Roadside Assistance requested! Help is on the way." });
      setSelectedVehicle("");
      setIssueType("");
      setLocation("");
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to request assistance." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const issueOptions = [
    { value: "FLAT_TIRE", label: "Flat Tire" },
    { value: "BATTERY_DEAD", label: "Dead Battery" },
    { value: "ENGINE_ISSUE", label: "Engine Breakdown" },
    { value: "TOWING", label: "Need Towing" },
    { value: "OTHER", label: "Other / Unsure" }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Roadside Assistance (RSA)</h2>
        <p className="text-gray-500 mt-2">Request emergency help if your vehicle breaks down.</p>
      </div>

      <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-red-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <CardHeader className="border-b border-gray-50 pb-6">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <div className="bg-red-50 p-3 rounded-xl text-red-600 shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
            <span className="font-heading tracking-tight text-gray-900">Request Emergency Assistance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {message.text && (
              <div className={`p-4 rounded-xl text-sm border font-medium ${
                message.type === "success" 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Select 
                  label="Vehicle in Trouble"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  options={vehicles.map(v => ({ value: v._id, label: `${v.brand} ${v.model} (${v.registrationNumber})` }))}
                  disabled={isLoading || vehicles.length === 0}
                  required
                />
                {vehicles.length === 0 && !isLoading && (
                  <div className="mt-2 flex flex-col items-start space-y-2">
                    <p className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100">
                      You haven't added any vehicles to your garage yet.
                    </p>
                    <Button asChild size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                      <a href="/customer/garage">Add a Vehicle Now</a>
                    </Button>
                  </div>
                )}
              </div>
              
              <Select 
                label="Type of Issue"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                options={issueOptions}
                required
              />
              
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Breakdown Location</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Enter address or coordinates (lat, lng)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={handleLocationDetect} className="shrink-0 flex items-center bg-gray-50 hover:bg-gray-100">
                    <Navigation className="w-4 h-4 mr-2 text-blue-600" />
                    Detect
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" isLoading={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 text-lg rounded-xl shadow-lg shadow-red-200">
                Send SOS Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
