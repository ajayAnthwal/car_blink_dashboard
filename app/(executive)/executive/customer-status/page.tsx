// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useCustomerStatus, useVerifyCustomerMutation } from "@/features/executive/hooks/useExecutiveQueries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Loader2, Phone, Mail, Clock, CheckCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export default function CustomerStatusPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: customersData, isLoading } = useCustomerStatus(page, limit, debouncedSearch);
  const customers = (customersData?.customers || []) as any[];
  const total = customersData?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const verifyMutation = useVerifyCustomerMutation();

  const handleVerify = async (id: string) => {
    try {
      await verifyMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to verify customer", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE": return "bg-success/10 text-success hover:bg-success/20";
      case "INACTIVE": return "bg-neutral-muted/10 text-neutral-muted hover:bg-neutral-muted/20";
      case "SUSPENDED": return "bg-danger/10 text-danger hover:bg-danger/20";
      default: return "bg-secondary-blue/10 text-secondary-blue hover:bg-secondary-blue/20";
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-navy flex items-center font-heading">
            <Users className="w-7 h-7 mr-3 text-primary-orange" /> 
            Customer Status Overview
          </h2>
          <p className="text-neutral-muted text-sm mt-2 font-body">Track and manage the current status of all registered customers.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to page 1 on search
            }}
            className="pl-10 h-10 w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20 bg-white rounded-2xl shadow-subtle border border-neutral-muted/20">
          <Loader2 className="w-10 h-10 text-primary-orange animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl shadow-subtle border border-neutral-muted/20 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium text-lg">
            {debouncedSearch ? "No customers found matching your search." : "No customers found."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-subtle border border-neutral-muted/20 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="font-semibold text-primary-navy w-[60px] text-center">S.No</TableHead>
                  <TableHead className="font-semibold text-primary-navy w-[250px]">Customer Details</TableHead>
                  <TableHead className="font-semibold text-primary-navy">Contact Info</TableHead>
                  <TableHead className="font-semibold text-primary-navy">Onboarding & Status</TableHead>
                  <TableHead className="font-semibold text-primary-navy text-center">Activity</TableHead>
                  <TableHead className="font-semibold text-primary-navy text-right">Verification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, index) => (
                  <TableRow key={customer._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Serial Number */}
                    <TableCell className="align-middle text-center font-medium text-gray-500">
                      {(page - 1) * limit + index + 1}
                    </TableCell>

                    {/* Customer Details */}
                    <TableCell className="align-top">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-navy/5 rounded-full flex items-center justify-center text-primary-navy font-bold shrink-0">
                          {customer.fullName?.charAt(0).toUpperCase() || "C"}
                        </div>
                        <div>
                          <div className="font-bold text-primary-navy">{customer.fullName || "Unknown Customer"}</div>
                          {customer.isVerified && (
                            <div className="text-xs text-success flex items-center mt-0.5 font-medium">
                              <CheckCircle className="w-3 h-3 mr-1" /> Verified User
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Info */}
                    <TableCell className="align-top">
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Mail className="w-4 h-4 mr-2 shrink-0 text-gray-400" /> 
                          <span className="truncate max-w-[200px]" title={customer.email}>{customer.email}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-2 shrink-0 text-gray-400" /> 
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>

                    {/* Onboarding & Status */}
                    <TableCell className="align-top">
                      <div className="space-y-2 text-sm">
                        <Badge variant="outline" className={`px-2.5 py-0.5 border-transparent ${getStatusColor(customer.status)}`}>
                          {customer.status || "UNKNOWN"}
                        </Badge>
                        <div className="flex items-center text-gray-500 text-xs mt-1">
                          <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0" /> 
                          Joined {new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>

                    {/* Activity */}
                    <TableCell className="align-top text-center">
                      <div className="flex justify-center gap-3">
                        <div className="inline-flex flex-col items-center p-2 bg-gray-50 rounded-lg border border-gray-100 min-w-[70px]">
                          <span className="text-xs text-gray-500 mb-0.5">Total</span>
                          <span className="font-bold text-primary-navy">{customer.totalBookings || 0}</span>
                        </div>
                        <div className="inline-flex flex-col items-center p-2 bg-blue-50/50 rounded-lg border border-blue-100 min-w-[70px]">
                          <span className="text-xs text-secondary-blue mb-0.5">Active</span>
                          <span className="font-bold text-secondary-blue">{customer.activeBookings || 0}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Verification / Action */}
                    <TableCell className="align-top text-right">
                      {!customer.isVerified ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-warning font-medium mb-1 flex items-center">
                            Not Verified
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleVerify(customer._id)}
                            className="bg-primary-orange text-white hover:bg-orange-600 border-none w-28"
                          >
                            Verify Now
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end pr-2 text-success items-center h-full">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500 font-medium">
              Showing page {page} of {totalPages} <span className="text-gray-400">({total} total customers)</span>
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="bg-white"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
