// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useAdminVehicles } from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Car, Search, Calendar, Phone } from "lucide-react";

export default function AdminVehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: vehiclesData, isLoading } = useAdminVehicles(1, 100);
  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.vehicles || vehiclesData?.docs || []);

  const filteredVehicles = vehicles.filter(v => {
    const term = searchQuery.toLowerCase();
    const ownerName = v.customerId?.fullName?.toLowerCase() || "";
    const make = v.make?.toLowerCase() || "";
    const model = v.model?.toLowerCase() || "";
    const regNo = v.registrationNumber?.toLowerCase() || "";
    return ownerName.includes(term) || make.includes(term) || model.includes(term) || regNo.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 p-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-900 via-primary-orange-dark to-primary-orange border border-primary-orange/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-white/30 backdrop-blur-sm">
            <Car className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-heading tracking-tight">Vehicle Registry</h2>
            <p className="text-white/80 mt-1 font-medium">Global directory of all customer vehicles on the platform.</p>
          </div>
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-md shadow-sm border-white/40 overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg text-primary-navy font-bold">Registered Vehicles</CardTitle>
            <div className="w-full md:w-72 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search by owner, brand, or reg no..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange w-full bg-white transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-orange" />
              <p className="font-medium">Loading vehicle registry...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-20 text-gray-400 flex flex-col items-center">
              <Car className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-gray-500">No vehicles found in the registry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Vehicle Details</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Registration</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Owner Info</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center shrink-0 border border-gray-200 text-gray-600 shadow-sm">
                            <Car className="w-5 h-5 text-primary-navy" />
                          </div>
                          <div>
                            <span className="font-bold text-lg text-gray-900 group-hover:text-primary-orange transition-colors">
                              {vehicle.make} {vehicle.model}
                            </span>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 font-medium">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {vehicle.year}</span>
                              {vehicle.fuelType && <span className="bg-gray-100 px-2 py-0.5 rounded-md">{vehicle.fuelType}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-100 border border-yellow-400 font-bold text-gray-800 uppercase tracking-widest shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          {vehicle.registrationNumber || "NOT SET"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {vehicle.customerId ? (
                          <>
                            <div className="font-bold text-gray-900">{vehicle.customerId.fullName}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Phone className="w-3 h-3" /> {vehicle.customerId.phone}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">Owner not found</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-[11px] font-bold tracking-wide uppercase rounded-full inline-flex items-center gap-1.5 ${
                          vehicle.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${vehicle.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {vehicle.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
