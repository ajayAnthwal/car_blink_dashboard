"use client";

import React, { useState, useEffect } from "react";
import { getVehicleBrands, getVehicleModels, createGarageVehicle, getGarageVehicles, updateGarageVehicle, deleteGarageVehicle, getBookings } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Car, Pencil, Trash2, Plus, History, X, CalendarCheck, MapPin } from "lucide-react";

interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  registrationNumber: string;
  fuelType: string;
  year: number;
}

export default function MyGaragePage() {
  const [brands, setBrands] = useState<{ _id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ _id: string; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [year, setYear] = useState("");

  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchBrands();
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      setSelectedModel("");
      return;
    }

    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const res = await getVehicleModels(selectedBrand);
        setModels(Array.isArray(res) ? res : (res?.docs || res?.data || []));
      } catch (err) {
        console.error("Failed to load models", err);
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    fetchModels();
  }, [selectedBrand]);

  const fetchBrands = async () => {
    try {
      const res = await getVehicleBrands();
      setBrands(Array.isArray(res) ? res : (res?.docs || res?.data || []));
    } catch (err) {
      console.error("Failed to load brands", err);
    } finally {
      setIsLoadingBrands(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await getGarageVehicles();
      setVehicles(Array.isArray(res) ? res : (res?.docs || res?.data || []));
    } catch (err) {
      console.error("Failed to load vehicles", err);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const selectedBrandObj = brands.find(b => b._id === selectedBrand);
      const selectedModelObj = models.find(m => m._id === selectedModel);

      if (!selectedBrandObj || !selectedModelObj) {
        setMessage({ type: "error", text: "Please select brand and model." });
        return;
      }

      const payload = {
        brand: selectedBrandObj.name,
        model: selectedModelObj.name,
        registrationNumber,
        fuelType,
        year: parseInt(year),
      };

      if (editingId) {
        await updateGarageVehicle(editingId, payload);
        setMessage({ type: "success", text: "Vehicle updated successfully!" });
        setEditingId(null);
      } else {
        await createGarageVehicle(payload);
        setMessage({ type: "success", text: "Vehicle added successfully to your garage!" });
      }

      setSelectedBrand("");
      setSelectedModel("");
      setRegistrationNumber("");
      setFuelType("");
      setYear("");
      fetchVehicles();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to save vehicle." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle._id);
    setRegistrationNumber(vehicle.registrationNumber);
    setFuelType(vehicle.fuelType);
    setYear(vehicle.year.toString());
    
    const brandObj = brands.find(b => b.name === vehicle.brand);
    const modelObj = models.find(m => m.name === vehicle.model);
    
    if (brandObj) {
      setSelectedBrand(brandObj._id);
    }
    if (modelObj) {
      setSelectedModel(modelObj._id);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteGarageVehicle(id);
      setMessage({ type: "success", text: "Vehicle deleted successfully!" });
      fetchVehicles();
      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to delete vehicle." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewHistory = async (vehicle: Vehicle) => {
    setHistoryVehicle(vehicle);
    setIsLoadingHistory(true);
    try {
      const res = await getBookings();
      const allBookings = Array.isArray(res) ? res : (res?.docs || res?.data || []);
      // Filter by vehicleId and only show completed/past
      const history = allBookings.filter((b: any) => 
        b.vehicleId && 
        (b.vehicleId._id === vehicle._id || b.vehicleId === vehicle._id) &&
        ['COMPLETED', 'CANCELLED'].includes(b.status)
      );
      setVehicleHistory(history);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedBrand("");
    setSelectedModel("");
    setRegistrationNumber("");
    setFuelType("");
    setYear("");
  };

  const fuelOptions = [
    { value: "PETROL", label: "Petrol" },
    { value: "DIESEL", label: "Diesel" },
    { value: "CNG", label: "CNG" },
    { value: "EV", label: "Electric" },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">My Garage</h2>

      <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-orange-50 p-2 rounded-xl text-primary-orange">
              <Car className="w-5 h-5" />
            </div>
            <span>{editingId ? "Edit Vehicle" : "Add a Vehicle"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {message.text && (
              <div className={`p-3 rounded-lg text-sm border ${
                message.type === "success" 
                  ? "bg-success/10 text-success border-success/20" 
                  : "bg-danger/10 text-danger border-danger/20"
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                label="Vehicle Brand"
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedModel("");
                }}
                options={brands.map(b => ({ value: b._id, label: b.name }))}
                disabled={isLoadingBrands}
                required
              />
              
              <Select 
                label="Vehicle Model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                options={models.map(m => ({ value: m._id, label: m.name }))}
                disabled={!selectedBrand || isLoadingModels}
                required
              />
              
              <Input 
                label="Registration Number"
                placeholder="e.g. MH 01 AB 1234"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Fuel Type"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  options={fuelOptions}
                  required
                />
                
                <Input 
                  label="Year"
                  type="number"
                  min="1990"
                  max={new Date().getFullYear()}
                  placeholder="2022"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button type="submit" isLoading={isSubmitting}>
                {editingId ? "Update Vehicle" : "Save Vehicle"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 font-heading tracking-tight mb-5">Saved Vehicles ({vehicles.length})</h3>
        {isLoadingVehicles ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
            <p className="text-gray-500 font-medium">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <Car className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">You haven&apos;t added any vehicles to your garage yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle._id} className="bg-white/90 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-gray-900 text-xl tracking-tight">
                        {vehicle.brand} {vehicle.model}
                      </h4>
                      <p className="text-sm font-medium text-gray-500 mt-0.5">
                        {vehicle.registrationNumber}
                      </p>
                      <div className="flex items-center space-x-2 mt-4 text-xs font-semibold text-gray-600">
                        <span className="bg-gray-100/80 px-2.5 py-1 rounded-md border border-gray-200/50">
                          {vehicle.fuelType}
                        </span>
                        <span className="bg-gray-100/80 px-2.5 py-1 rounded-md border border-gray-200/50">
                          {vehicle.year}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewHistory(vehicle)}
                        className="p-2 text-neutral-muted hover:text-secondary-blue hover:bg-secondary-blue/5 rounded-lg transition-colors"
                        title="View Service History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="p-2 text-neutral-muted hover:text-primary-orange hover:bg-neutral-bg rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle._id)}
                        disabled={deletingId === vehicle._id}
                        className="p-2 text-neutral-muted hover:text-danger hover:bg-danger/5 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === vehicle._id ? (
                          <div className="w-4 h-4 border-2 border-danger border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {historyVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
              <h3 className="font-heading font-bold text-xl text-gray-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-secondary-blue" /> 
                Service History: {historyVehicle.brand} {historyVehicle.model}
              </h3>
              <button 
                onClick={() => setHistoryVehicle(null)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isLoadingHistory ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-secondary-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : vehicleHistory.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                    <History className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No past services found for this vehicle.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicleHistory.map((booking: any) => (
                    <div key={booking._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-heading font-bold text-lg text-primary-navy">
                          {booking.serviceId?.name || "Service Appointment"}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'COMPLETED' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <CalendarCheck className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(booking.preferredDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {booking.cityId?.name || "N/A"}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</span>
                        <span className="font-bold text-gray-900">₹{booking.totalAmount || "0"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50 rounded-b-3xl">
              <Button onClick={() => setHistoryVehicle(null)} variant="outline" className="font-semibold">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
