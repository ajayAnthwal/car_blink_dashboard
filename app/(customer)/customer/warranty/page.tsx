// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ChevronDown, ChevronUp, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const filteredWarranties = warranties.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (w.serviceId && String(w.serviceId).toLowerCase().includes(q)) ||
      (w.coverageDetails && String(w.coverageDetails).toLowerCase().includes(q)) ||
      (w.status && String(w.status).toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredWarranties.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredWarranties.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedWarranties = filteredWarranties.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">My Warranties</h2>
          <p className="text-gray-500 text-sm mt-1">Track active warranty coverages for your services.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search warranties..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10 rounded-xl bg-white border-gray-200 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Loading warranties...</p>
        </div>
      ) : filteredWarranties.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <ShieldCheck className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">
            {searchQuery ? `No warranties matching "${searchQuery}".` : "You don't have any active warranties."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {paginatedWarranties.map((warranty) => (
              <Card key={warranty._id} className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md shadow-subtle border-white/40 hover:shadow-elevated transition-all duration-300 relative overflow-hidden">
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

          {/* Pagination Controls */}
          {filteredWarranties.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 bg-white/80 p-4 rounded-2xl">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredWarranties.length)}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{filteredWarranties.length}</span> warranties
              </p>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === page
                          ? "bg-primary-orange text-white shadow-sm"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 text-xs flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
