// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Car, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  useGarageVehicles, 
  useVehicleBrands, 
  useVehicleModels, 
  useCustomerBookings,
  useAddGarageVehicle,
  useUpdateGarageVehicle,
  useDeleteGarageVehicle 
} from "@/features/customer/hooks/useCustomerQueries";
import { VehicleForm, VehicleFormValues } from "@/features/customer/components/garage/VehicleForm";
import { VehicleCard } from "@/features/customer/components/garage/VehicleCard";
import { VehicleHistoryList } from "@/features/customer/components/garage/VehicleHistoryList";

export default function MyGaragePage() {
  const [selectedBrand, setSelectedBrand] = useState("");
  
  const { data: brandsData = [], isLoading: isLoadingBrands } = useVehicleBrands();
  const { data: modelsData = [], isLoading: isLoadingModels } = useVehicleModels(selectedBrand);
  const { data: vehiclesData = [], isLoading: isLoadingVehicles } = useGarageVehicles();
  const { data: bookingsData } = useCustomerBookings();
  
  const addVehicleMutation = useAddGarageVehicle();
  const updateVehicleMutation = useUpdateGarageVehicle();
  const deleteVehicleMutation = useDeleteGarageVehicle();
  
  const brands = Array.isArray(brandsData) ? brandsData : (brandsData?.docs || brandsData?.data || []);
  const models = Array.isArray(modelsData) ? modelsData : (modelsData?.docs || modelsData?.data || []);
  const vehicles = (Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.docs || vehiclesData?.data || []));
  const bookings = bookingsData?.bookings || [];

  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [historyVehicle, setHistoryVehicle] = useState<any | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);

  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = (data: VehicleFormValues) => {
    setMessage({ type: "", text: "" });
    
    const selectedBrandObj = brands.find((b: any) => b._id === data.brand);
    const selectedModelObj = models.find((m: any) => m._id === data.model);

    if (!selectedBrandObj || !selectedModelObj) {
      setMessage({ type: "error", text: "Please select valid brand and model." });
      return;
    }

    const payload = {
      brand: selectedBrandObj.name,
      model: selectedModelObj.name,
      registrationNumber: data.registrationNumber,
      fuelType: data.fuelType,
      year: data.year,
    };

    if (editingVehicle) {
      updateVehicleMutation.mutate(
        { id: editingVehicle._id, data: payload },
        {
          onSuccess: () => {
            setMessage({ type: "success", text: "Vehicle updated successfully!" });
            setEditingVehicle(null);
            setSelectedBrand("");
          },
          onError: (err: any) => {
            setMessage({ type: "error", text: err?.message || "Failed to update vehicle" });
          }
        }
      );
    } else {
      addVehicleMutation.mutate(payload, {
        onSuccess: () => {
          setMessage({ type: "success", text: "Vehicle added successfully to your garage!" });
          setSelectedBrand("");
        },
        onError: (err: any) => {
          setMessage({ type: "error", text: err?.message || "Failed to save vehicle" });
        }
      });
    }
  };

  const handleEdit = (vehicle: any) => {
    const brandObj = brands.find((b: any) => b.name === vehicle.brand);
    const modelObj = models.find((m: any) => m.name === vehicle.model);
    
    if (brandObj) setSelectedBrand(brandObj._id);

    setEditingVehicle({
      ...vehicle,
      brand: brandObj?._id || "",
      model: modelObj?._id || "",
    });
    setMessage({ type: "", text: "" });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteVehicleMutation.mutate(id, {
      onSuccess: () => {
        setMessage({ type: "success", text: "Vehicle deleted successfully!" });
        if (editingVehicle?._id === id) {
          setEditingVehicle(null);
          setSelectedBrand("");
        }
      },
      onError: (err: any) => {
        setMessage({ type: "error", text: err?.message || "Failed to delete vehicle." });
      },
      onSettled: () => {
        setDeletingId(null);
      }
    });
  };

  const handleViewHistory = (vehicle: any) => {
    setHistoryVehicle(vehicle);
    try {
      const history = bookings.filter((b: any) => 
        b.vehicleId && 
        (b.vehicleId._id === vehicle._id || b.vehicleId === vehicle._id) &&
        ['COMPLETED', 'CANCELLED'].includes(b.status)
      );
      setVehicleHistory(history);
    } catch (err) {
      console.error("Failed to load vehicle history", err);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 container px-4 sm:px-6 md:px-8 mx-auto pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">My Garage</h2>

      <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-orange-50 p-2 rounded-xl text-primary-orange">
              <Car className="w-5 h-5" />
            </div>
            <span>{editingVehicle ? "Edit Vehicle" : "Add a Vehicle"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message.text && (
            <div className={`mb-6 p-3 rounded-lg text-sm border ${
              message.type === "success" 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-danger/10 text-danger border-danger/20"
            }`}>
              {message.text}
            </div>
          )}

          <VehicleForm
            brands={brands}
            models={models}
            isLoadingBrands={isLoadingBrands}
            isLoadingModels={isLoadingModels}
            initialData={editingVehicle}
            onBrandChange={setSelectedBrand}
            onSubmit={handleSubmit}
            onCancel={editingVehicle ? () => {
              setEditingVehicle(null);
              setSelectedBrand("");
            } : undefined}
            isSubmitting={addVehicleMutation.isPending || updateVehicleMutation.isPending}
          />
        </CardContent>
      </Card>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 font-heading tracking-tight mb-5">Saved Vehicles ({vehicles.length})</h3>
        {isLoadingVehicles ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
            <p className="text-gray-500 font-medium">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-gradient-to-r from-orange-50/50 via-white to-orange-50/50 p-12 md:p-16 rounded-3xl shadow-sm border border-orange-100/50 text-center flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-subtle flex items-center justify-center mb-6 border border-orange-100 rotate-3">
              <Car className="w-12 h-12 text-primary-orange -rotate-3" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-heading mb-2">No Vehicles Yet</h3>
            <p className="text-gray-500 font-medium max-w-sm mb-6">You haven&apos;t added any vehicles to your garage yet. Add your first car to manage its health and bookings!</p>
            <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-primary-orange hover:bg-primary-orange-dark text-white rounded-xl px-8 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Vehicle
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicles.map((vehicle: any) => (
              <VehicleCard
                key={vehicle._id}
                vehicle={vehicle}
                onViewHistory={handleViewHistory}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deletingId === vehicle._id}
              />
            ))}
          </div>
        )}
      </div>

      <VehicleHistoryList
        vehicle={historyVehicle}
        history={vehicleHistory}
        isLoading={false}
        onClose={() => setHistoryVehicle(null)}
      />
    </div>
  );
}
