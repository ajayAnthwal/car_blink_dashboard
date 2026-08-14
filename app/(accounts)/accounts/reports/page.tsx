// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useInvoicesReportMutation } from "@/features/accounts/hooks/useAccountsQueries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileBarChart, Download, Building2, Wrench, Briefcase, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [reportData, setReportData] = useState<any>(null);

  const reportMutation = useInvoicesReportMutation();

  const handleFetchReport = async () => {
    if (!fromDate || !toDate) {
      setMessage({ type: "error", text: "Please select both Start and End dates." });
      return;
    }

    setMessage({ type: "", text: "" });

    try {
      const res = await reportMutation.mutateAsync({ fromDate, toDate });
      
      // Robust extraction
      let actualData = res;
      if (res?.data?.summary) {
        actualData = res.data;
      } else if (res?.data?.data?.summary) {
        actualData = res.data.data;
      } else if (res?.summary) {
        actualData = res;
      }

      setReportData(actualData);
      setMessage({ type: "success", text: "Business Report generated successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to generate report." });
    }
  };

  const exportToExcel = () => {
    try {
      if (!reportData || !reportData.summary) {
        setMessage({ type: "error", text: "No data available to export." });
        return;
      }
      
      let excelData = [];
      const fileName = `Business_Report_${fromDate}_to_${toDate}.xlsx`;
      
      // Top Level Summary
      excelData.push({ 'City': "OVERALL SUMMARY", 'Service': "", 'Total Jobs': "", 'Total Revenue (₹)': "" });
      excelData.push({ 'City': "Platform Wide", 'Service': "All Services", 'Total Jobs': reportData.summary.totalJobs, 'Total Revenue (₹)': reportData.summary.totalRevenue });
      excelData.push({});
      
      // Detailed Breakdown
      excelData.push({ 'City': "CITY & SERVICE BREAKDOWN", 'Service': "", 'Total Jobs': "", 'Total Revenue (₹)': "" });
      
      const combos = Object.keys(reportData.summary.byCityAndService || {});
      if (combos.length === 0) {
        setMessage({ type: "error", text: "No business records found for this period." });
        return;
      }

      combos.forEach(key => {
        const item = reportData.summary.byCityAndService[key];
        excelData.push({
          'City': item.city,
          'Service': item.service,
          'Total Jobs': item.count,
          'Total Revenue (₹)': item.revenue
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const columnWidths = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 20 }];
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Business Report");
      XLSX.writeFile(workbook, fileName);
      
    } catch (err: any) {
      setMessage({ type: "error", text: "Failed to download Excel file: " + err.message });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-3xl shadow-sm border border-neutral-muted/10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-primary-navy flex items-center tracking-tight">
            <TrendingUp className="w-8 h-8 mr-3 text-primary-orange" />
            Platform Business Dashboard
          </h2>
          <p className="text-neutral-muted mt-2 text-sm max-w-xl leading-relaxed">
            Generate a unified business report to analyze performance across all cities and services. Instantly see where your revenue is coming from.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-bg/30 p-4 rounded-2xl border border-neutral-muted/10">
          <div className="space-y-1 w-full sm:w-auto">
            <label className="text-xs font-bold text-neutral-dark uppercase tracking-wider pl-1">Start Date</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-white border-none shadow-sm h-11" required />
          </div>
          <div className="space-y-1 w-full sm:w-auto">
            <label className="text-xs font-bold text-neutral-dark uppercase tracking-wider pl-1">End Date</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-white border-none shadow-sm h-11" required />
          </div>
          <div className="space-y-1 w-full sm:w-auto pt-5">
            <Button 
              size="lg"
              className="w-full sm:w-auto h-11 bg-primary-orange hover:bg-primary-orange-dark text-white font-bold shadow-md shadow-primary-orange/20"
              onClick={handleFetchReport}
              isLoading={reportMutation.isPending}
            >
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-sm font-semibold border shadow-sm flex items-center ${
          message.type === "success" ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {message.text}
        </div>
      )}

      {/* SKELETON LOADER */}
      {reportMutation.isPending && (
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-neutral-200 rounded-3xl"></div>
            <div className="h-32 bg-neutral-200 rounded-3xl"></div>
          </div>
          <div className="h-64 bg-neutral-200 rounded-3xl"></div>
        </div>
      )}

      {/* RESULTS SECTION */}
      {reportData && reportData.summary && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
          
          {/* HIGH-LEVEL METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-neutral-muted/10 shadow-lg shadow-neutral-muted/5 flex items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-navy/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="w-16 h-16 rounded-2xl bg-primary-navy/10 flex items-center justify-center text-primary-navy shrink-0">
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-muted uppercase tracking-wider mb-1">Total Platform Jobs</p>
                <p className="text-5xl font-black text-primary-navy">{reportData.summary.totalJobs || 0}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-neutral-muted/10 shadow-lg shadow-neutral-muted/5 flex items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center text-success shrink-0">
                <FileBarChart className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-muted uppercase tracking-wider mb-1">Total Platform Revenue</p>
                <p className="text-5xl font-black text-success">₹{reportData.summary.totalRevenue?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          {/* DETAILED DATA TABLE */}
          <Card className="border-0 shadow-2xl shadow-neutral-muted/10 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-neutral-50/80 border-b border-neutral-muted/10 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-black text-primary-navy">Business Performance Breakdown</CardTitle>
                <p className="text-sm font-medium text-neutral-muted mt-1">Aggregated by City and Service Category</p>
              </div>
              <Button 
                size="lg" 
                onClick={exportToExcel}
                className="bg-primary-navy hover:bg-primary-navy-dark text-white font-bold rounded-xl shadow-lg shadow-primary-navy/20 transition-transform active:scale-95"
              >
                <Download className="w-5 h-5 mr-2" /> Download Excel Report
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white border-b border-neutral-muted/10">
                    <tr>
                      <th className="px-8 py-5 text-xs font-bold text-neutral-muted uppercase tracking-wider">City</th>
                      <th className="px-8 py-5 text-xs font-bold text-neutral-muted uppercase tracking-wider">Service</th>
                      <th className="px-8 py-5 text-xs font-bold text-neutral-muted uppercase tracking-wider text-right">Total Jobs</th>
                      <th className="px-8 py-5 text-xs font-bold text-neutral-muted uppercase tracking-wider text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-muted/5 bg-neutral-50/30">
                    {Object.keys(reportData.summary.byCityAndService || {}).map((key, idx) => {
                      const item = reportData.summary.byCityAndService[key];
                      return (
                        <tr key={idx} className="hover:bg-white transition-colors duration-200">
                          <td className="px-8 py-5">
                            <div className="flex items-center font-bold text-neutral-dark">
                              <Building2 className="w-4 h-4 mr-2 text-neutral-muted" />
                              {item.city}
                            </div>
                          </td>
                          <td className="px-8 py-5 font-semibold text-secondary-blue flex items-center">
                            <Wrench className="w-4 h-4 mr-2 text-neutral-muted" />
                            {item.service}
                          </td>
                          <td className="px-8 py-5 text-right font-black text-primary-navy text-lg">{item.count}</td>
                          <td className="px-8 py-5 text-right font-black text-success text-lg">₹{item.revenue?.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    
                    {Object.keys(reportData.summary.byCityAndService || {}).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                              <TrendingUp className="w-10 h-10 text-neutral-muted/50" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-dark">No Business Data Found</h3>
                            <p className="text-neutral-muted mt-2 max-w-sm">There are no completed services in the selected date range. Try selecting a different period.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
