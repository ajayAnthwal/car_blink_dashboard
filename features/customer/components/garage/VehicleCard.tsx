import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { History, Pencil, Trash2 } from "lucide-react";

interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  registrationNumber: string;
  fuelType: string;
  year: number;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onViewHistory: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function VehicleCard({
  vehicle,
  onViewHistory,
  onEdit,
  onDelete,
  isDeleting,
}: VehicleCardProps) {
  return (
    <Card 
      onClick={() => onViewHistory(vehicle)}
      className="bg-white/90 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:border-secondary-blue/50 hover:-translate-y-1 transition-all cursor-pointer"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-heading font-bold text-gray-900 text-xl tracking-tight">
              {vehicle.brand} {vehicle.model}
            </h4>
            <p className="text-sm font-medium text-gray-500 mt-0.5">
              {vehicle.registrationNumber}
            </p>
            
            {/* Vehicle Health Indicator */}
            <div className="mt-4 flex items-center space-x-2" title="Estimated Vehicle Health">
              <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                 <div className={`h-full ${vehicle.year > 2018 ? 'bg-success w-[85%]' : 'bg-warning w-[60%]'}`}></div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Health</span>
            </div>

            <div className="flex items-center space-x-2 mt-4 text-xs font-semibold text-gray-600">
              <span className="bg-gray-100/80 px-2.5 py-1 rounded-md border border-gray-200/50">
                {vehicle.fuelType}
              </span>
              <span className="bg-gray-100/80 px-2.5 py-1 rounded-md border border-gray-200/50">
                {vehicle.year}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onViewHistory(vehicle)}
              className="p-2 text-neutral-muted hover:text-secondary-blue hover:bg-secondary-blue/5 rounded-lg transition-colors"
              title="View Service History"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(vehicle)}
              className="p-2 text-neutral-muted hover:text-primary-orange hover:bg-neutral-bg rounded-lg transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(vehicle._id)}
              disabled={isDeleting}
              className="p-2 text-neutral-muted hover:text-danger hover:bg-danger/5 rounded-lg transition-colors disabled:opacity-50"
              title="Delete"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-danger border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
