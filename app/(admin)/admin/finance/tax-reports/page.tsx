// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { FileSpreadsheet, Download, Calendar, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import toast from "react-hot-toast";

export default function AdminTaxReportsPage() {
  const { accessToken } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!startDate || !endDate) return toast.error("Please select both start and end dates.");
    if (new Date(startDate) > new Date(endDate)) return toast.error("Start date cannot be after end date.");

    setIsDownloading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${baseUrl}/super-admin/tax-reports/export?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to download tax report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Tax report downloaded successfully!");
      
    } catch (error: unknown) {
      toast.error(error.message || "Failed to download tax report");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-navy to-indigo-900 rounded-3xl p-6 flex items-center justify-between shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Tax & Compliance Reports</h1>
            <p className="text-white/80 mt-1 font-medium">Generate GST and TDS CSV reports for accounting.</p>
          </div>
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-orange" /> Export Monthly Tax Report
          </CardTitle>
          <CardDescription>
            Select a date range to generate a CSV report of all processed settlements. 
            The report includes Gross Amounts, Platform Commissions, and TDS Deductions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date *</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm font-bold text-gray-900 bg-gray-50"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">End Date *</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm font-bold text-gray-900 bg-gray-50"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-100 pt-6">
            <button 
              onClick={handleDownload}
              disabled={isDownloading || !startDate || !endDate}
              className="bg-primary-navy hover:bg-blue-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isDownloading ? 'Generating CSV...' : 'Download Tax Report (CSV)'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
