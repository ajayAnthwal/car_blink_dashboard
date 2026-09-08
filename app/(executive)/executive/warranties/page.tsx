// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Search, Loader2, FileText, Calendar, User, Wrench, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/axios";

export default function ExecutiveWarrantiesPage() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchWarranties = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/executive/warranties");
      const list = res.data?.warranties || res.warranties || res.data || [];
      setWarranties(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch executive warranties:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const filteredWarranties = warranties.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.customerId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partnerId?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bookingId?.vehicleId?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bookingId?.vehicleId?.model?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = warranties.filter((w) => w.status === "ACTIVE").length;
  const expiredCount = warranties.filter((w) => w.status === "EXPIRED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary-orange" />
            <span>Service Warranties Oversight</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor partner-issued service warranties, validity periods, and customer warranty documents.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Warranties</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{warranties.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Warranties</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expired Warranties</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{expiredCount}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-gray-200">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Customer, Partner, Vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
            {["ALL", "ACTIVE", "EXPIRED"].map((st) => (
              <Button
                key={st}
                type="button"
                variant={statusFilter === st ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className={`text-xs ${statusFilter === st ? "bg-primary-navy text-white" : ""}`}
              >
                {st}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warranties List / Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
          <CardTitle className="text-base font-semibold text-gray-900">Issued Warranties Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
            </div>
          ) : filteredWarranties.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">No warranties found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-4">Service & Vehicle</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Partner Workshop</th>
                    <th className="py-3.5 px-4">Warranty Period</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredWarranties.map((w: any) => (
                    <tr key={w._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">
                          {w.bookingId?.serviceId?.name || "Service Warranty"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-primary-orange" />
                          <span>
                            {w.bookingId?.vehicleId?.brand} {w.bookingId?.vehicleId?.model}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{w.customerId?.fullName || "Customer"}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{w.customerId?.phone}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">
                          {w.partnerId?.businessName || "Workshop Partner"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{w.partnerId?.phone}</div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-gray-700">
                        {w.warrantyPeriodMonths} Months
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{new Date(w.expiryDate || new Date()).toLocaleDateString("en-IN")}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            w.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {w.warrantyDocumentUrl ? (
                          <a
                            href={w.warrantyDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs text-primary-orange hover:underline font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View PDF</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No Document</span>
                        )}
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
