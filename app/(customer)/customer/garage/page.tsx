"use client";

import React, { useState, useEffect } from "react";
import { getVehicleBrands, getVehicleModels, createGarageVehicle, getGarageVehicles, updateGarageVehicle, deleteGarageVehicle } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Car, Pencil, Trash2, Plus } from "lucide-react";

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
        setModels(res?.docs || res || []);
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
      setBrands(res?.docs || res || []);
    } catch (err) {
      console.error("Failed to load brands", err);
    } finally {
      setIsLoadingBrands(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await getGarageVehicles();
      setVehicles(res?.docs || res || []);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">My Garage</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-primary-orange" />
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
        <h3 className="text-xl font-bold text-primary-navy mb-4">Saved Vehicles ({vehicles.length})</h3>
        {isLoadingVehicles ? (
          <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
            <p className="text-neutral-muted">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center flex flex-col items-center justify-center">
            <Car className="w-12 h-12 text-neutral-muted/30 mb-3" />
            <p className="text-neutral-muted">You haven&apos;t added any vehicles to your garage yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-primary-navy text-lg">
                        {vehicle.brand} {vehicle.model}
                      </h4>
                      <p className="text-sm text-neutral-muted mt-1">
                        {vehicle.registrationNumber}
                      </p>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-neutral-muted">
                        <span className="bg-neutral-bg px-2 py-1 rounded-md border border-neutral-muted/20">
                          {vehicle.fuelType}
                        </span>
                        <span className="bg-neutral-bg px-2 py-1 rounded-md border border-neutral-muted/20">
                          {vehicle.year}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
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
    </div>
  );
}
