// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useCustomerWarranties, useWarrantyDetails } from "@/features/customer/hooks/useCustomerQueries";

interface CustomerWarranty {
  _id: string;
  bookingId: string;
  vehicleId: string;
  serviceId: string;
  startDate: string;
  endDate: string;
  coverageDetails: string;
  status: string;
}

export default function WarrantiesPage() {
  const { data: warrantiesData, isLoading } = useCustomerWarranties();
  const warranties = (warrantiesData?.warranties || []) as unknown as CustomerWarranty[];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const { data: selectedWarrantyData, isLoading: isLoadingDetails } = useWarrantyDetails(expandedId);
  const selectedWarranty = selectedWarrantyData as CustomerWarranty | null;

  const handleViewDetails = (warranty: CustomerWarranty) => {
    if (expandedId === warranty._id) {
      setExpandedId(null);
    } else {
      setExpandedId(warranty._id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE": return "bg-success/10 text-success border-success/20";
      case "EXPIRED": return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
      case "CLAIMED": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 container px-4 sm:px-6 md:px-8 mx-auto pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">My Warranties</h2>

      {isLoading ? (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Loading warranties...</p>
        </div>
      ) : warranties.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <ShieldCheck className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">You don&apos;t have any active warranties.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {warranties.map((warranty) => (
            <Card key={warranty._id} className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md shadow-subtle border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between cursor-pointer" onClick={() => handleViewDetails(warranty)}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="bg-orange-50 p-2 rounded-xl text-primary-orange">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h4 className="font-heading font-bold text-gray-900 text-lg">
                        {warranty.serviceId || "Service Warranty"}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(warranty.status)}`}>
                        {warranty.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                      Valid: {new Date(warranty.startDate).toLocaleDateString()} - {new Date(warranty.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-neutral-muted hover:text-neutral-dark p-1">
                    {expandedId === warranty._id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {expandedId === warranty._id && (
                  <div className="mt-4 pt-4 border-t border-neutral-muted/20">
                    {isLoadingDetails ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
                      </div>
                    ) : selectedWarranty ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm bg-gray-50/50 p-5 rounded-xl border border-gray-100 mt-4">
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Vehicle</p>
                          <p className="font-bold text-gray-900">{selectedWarranty.vehicleId || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Service</p>
                          <p className="font-bold text-gray-900">{selectedWarranty.serviceId || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Start Date</p>
                          <p className="font-bold text-gray-900">{new Date(selectedWarranty.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">End Date</p>
                          <p className="font-bold text-gray-900">{new Date(selectedWarranty.endDate).toLocaleDateString()}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Coverage Details</p>
                          <p className="font-medium text-gray-700">{selectedWarranty.coverageDetails}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
