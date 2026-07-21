"use client";

import React, { useState, useEffect } from "react";
import { getWarranties, getWarrantyById } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ShieldCheck, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface Warranty {
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
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWarranties();
  }, []);

  const fetchWarranties = async () => {
    try {
      const res = await getWarranties();
      setWarranties(res?.docs || res || []);
    } catch (err) {
      console.error("Failed to load warranties", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (warranty: Warranty) => {
    if (expandedId === warranty._id) {
      setExpandedId(null);
      setSelectedWarranty(null);
      return;
    }
    setIsLoadingDetails(true);
    try {
      const res = await getWarrantyById(warranty._id);
      setSelectedWarranty(res?.docs || res || []);
      setExpandedId(warranty._id);
    } catch (err) {
      console.error("Failed to load warranty details", err);
    } finally {
      setIsLoadingDetails(false);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">Warranties</h2>

      {isLoading ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
          <p className="text-neutral-muted">Loading warranties...</p>
        </div>
      ) : warranties.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <ShieldCheck className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
          <p className="text-neutral-muted">No warranties found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {warranties.map((warranty) => (
            <Card key={warranty._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between cursor-pointer" onClick={() => handleViewDetails(warranty)}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <ShieldCheck className="w-5 h-5 text-primary-orange" />
                      <h4 className="font-semibold text-primary-navy">
                        {warranty.serviceId || "Service Warranty"}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(warranty.status)}`}>
                        {warranty.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-muted">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-muted">Vehicle</p>
                          <p className="font-medium">{selectedWarranty.vehicleId || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-neutral-muted">Service</p>
                          <p className="font-medium">{selectedWarranty.serviceId || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-neutral-muted">Start Date</p>
                          <p className="font-medium">{new Date(selectedWarranty.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-neutral-muted">End Date</p>
                          <p className="font-medium">{new Date(selectedWarranty.endDate).toLocaleDateString()}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-neutral-muted">Coverage Details</p>
                          <p className="font-medium">{selectedWarranty.coverageDetails}</p>
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
