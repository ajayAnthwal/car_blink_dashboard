import React from "react";
import { History, X, CalendarCheck, MapPin } from "lucide-react";

interface Vehicle {
  _id: string;
  brand: string;
  model: string;
}

interface Booking {
  _id: string;
  serviceId?: { name: string };
  status: string;
  description?: string;
  createdAt: string;
  cityId?: { name: string };
}

interface VehicleHistoryListProps {
  vehicle: Vehicle | null;
  history: Booking[];
  isLoading: boolean;
  onClose: () => void;
}

export function VehicleHistoryList({
  vehicle,
  history,
  isLoading,
  onClose,
}: VehicleHistoryListProps) {
  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-white/20">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
          <h3 className="font-heading font-bold text-xl text-gray-900 flex items-center">
            <History className="w-5 h-5 mr-2 text-secondary-blue" /> 
            Service History: {vehicle.brand} {vehicle.model}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-secondary-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                <History className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No past services found for this vehicle.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((booking: Booking) => (
                <div key={booking._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-default">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900">{booking.serviceId?.name || "Service"}</h4>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                      booking.status === 'COMPLETED' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{booking.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <CalendarCheck className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                    {booking.cityId && (
                      <div className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {booking.cityId.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
