"use client";

import React, { useState, useEffect } from "react";
import { getCommissionReport, getAdminFinanceSummary } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, IndianRupee, TrendingUp, Calendar, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminFinancePage() {
  const [report, setReport] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date filters defaulting to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(lastDay);
  const [partnerId, setPartnerId] = useState("");

  const fetchFinanceData = async () => {
    setIsLoading(true);
    try {
      const [reportRes, summaryRes] = await Promise.all([
        getCommissionReport(new Date(fromDate).toISOString(), new Date(toDate).toISOString(), partnerId || undefined),
        getAdminFinanceSummary()
      ]);
      setReport(reportRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error("Failed to load finance data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFinanceData();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 p-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-green-900 via-primary-navy to-primary-navy border border-primary-navy/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm">
            <IndianRupee className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-heading tracking-tight">Finance & Commissions</h2>
            <p className="text-white/80 mt-1 font-medium">Track platform earnings, partner revenue, and payouts.</p>
          </div>
        </div>
      </div>

      {isLoading && !report ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
          <p className="font-medium">Loading financial records...</p>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Platform Revenue</p>
                    <h3 className="text-3xl font-bold text-gray-900 font-heading">
                      {summary?.totalRevenue?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) || '₹0'}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Commission Earned (Period)</p>
                    <h3 className="text-3xl font-bold text-gray-900 font-heading">
                      {report?.totalCommission?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) || '₹0'}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                    <IndianRupee className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Partner Revenue Generated</p>
                    <h3 className="text-3xl font-bold text-gray-900 font-heading">
                      {report?.totalRevenue?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) || '₹0'}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                    <Building2 className="w-6 h-6 text-primary-orange" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Data Table */}
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-50 bg-gray-50/50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-lg text-primary-navy font-bold">Commission Reports</CardTitle>
                <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 hidden sm:block" />
                    <Input 
                      type="date" 
                      value={fromDate} 
                      onChange={(e) => setFromDate(e.target.value)}
                      className="rounded-xl border-gray-200 text-sm"
                    />
                    <span className="text-gray-400">to</span>
                    <Input 
                      type="date" 
                      value={toDate} 
                      onChange={(e) => setToDate(e.target.value)}
                      className="rounded-xl border-gray-200 text-sm"
                    />
                  </div>
                  <Input 
                    type="text" 
                    placeholder="Partner ID (Optional)"
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    className="rounded-xl border-gray-200 text-sm w-full sm:w-48"
                  />
                  <Button type="submit" className="bg-primary-navy hover:bg-primary-navy-light text-white rounded-xl">
                    Apply Filter
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">Partner Info</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-right">Total Revenue</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-right">Commission Due</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {!report?.details || report.details.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-10 text-gray-400 font-medium">No transactions found for this period.</td></tr>
                    ) : report.details.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{row.partnerId?.businessName || row.partnerId?.fullName || "Unknown Partner"}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1">{row.partnerId?._id || row._id || "-"}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {row.partnerRevenue?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          {row.commissionAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {row.totalBookings || 0} Bookings
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
