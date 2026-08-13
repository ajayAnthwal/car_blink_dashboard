// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useGstReportMutation, useInvoicesReportMutation } from "@/features/accounts/hooks/useAccountsQueries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileBarChart, Download } from "lucide-react";

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cityId, setCityId] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [message, setMessage] = useState({ type: "", text: "" });

  const [reportData, setReportData] = useState<unknown>(null);
  const [reportType, setReportType] = useState<"gst" | "invoice" | null>(null);

  const gstMutation = useGstReportMutation();
  const invoiceMutation = useInvoicesReportMutation();

  const handleFetchReport = async (type: "gst" | "invoice") => {
    if (!fromDate || !toDate) {
      setMessage({ type: "error", text: "Please select both From and To dates." });
      return;
    }

    setMessage({ type: "", text: "" });

    try {
      let res;
      if (type === "gst") {
        res = await gstMutation.mutateAsync({ fromDate, toDate });
      } else {
        res = await invoiceMutation.mutateAsync({ fromDate, toDate, cityId, serviceId });
      }
      
      // Unpack response properly
      const actualData = res?.data || res;
      setReportData(actualData);
      setReportType(type);

      setMessage({ type: "success", text: `${type.toUpperCase()} Report fetched successfully.` });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || `Failed to fetch ${type.toUpperCase()} report.` });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary-navy flex items-center">
          <FileBarChart className="w-6 h-6 mr-2 text-primary-orange" />
          Reports & Analytics
        </h2>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === "success" 
            ? "bg-success/10 text-success border-success/20" 
            : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
            />
            <Input
              type="date"
              label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-primary-navy">
          <CardHeader>
            <CardTitle>GST Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-muted">
              Download the GST report containing platform fees, partner payouts, and calculated taxes for the selected period.
            </p>
            <Button 
              className="w-full"
              onClick={() => handleFetchReport("gst")}
              isLoading={gstMutation.isPending}
            >
              <FileBarChart className="w-4 h-4 mr-2" /> View GST Report
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary-orange">
          <CardHeader>
            <CardTitle>Invoices Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-muted">
              Download all invoice records. You can optionally filter by City ID or Service ID.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <Input
                placeholder="City ID (Optional)"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
              />
              <Input
                placeholder="Service ID (Optional)"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              />
            </div>
            <Button 
              className="w-full bg-primary-orange hover:bg-primary-orange-dark"
              onClick={() => handleFetchReport("invoice")}
              isLoading={invoiceMutation.isPending}
            >
              <FileBarChart className="w-4 h-4 mr-2" /> View Invoices Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {reportType && reportData && (
        <Card className="mt-8 border-t-4 border-t-primary-navy shadow-lg overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-neutral-muted/5 border-b border-neutral-muted/10 pb-4">
            <CardTitle>{reportType === 'gst' ? 'GST Report Details' : 'Invoices Report Details'}</CardTitle>
            <Button size="sm" variant="outline" onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", `${reportType}_report_${fromDate}_to_${toDate}.json`);
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}>
              <Download className="w-4 h-4 mr-2" /> Export JSON
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {reportType === 'gst' && reportData.summary && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gradient-to-r from-primary-navy/5 to-transparent p-4 rounded-xl border border-primary-navy/10">
                <div>
                  <p className="text-sm font-semibold text-neutral-muted uppercase tracking-wider mb-1">Total Collected</p>
                  <p className="text-xl font-extrabold text-primary-navy">₹{reportData.summary.totalAmountCollected?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-muted uppercase tracking-wider mb-1">Total Base</p>
                  <p className="text-xl font-extrabold text-primary-navy">₹{reportData.summary.totalBaseAmount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-muted uppercase tracking-wider mb-1">Total GST</p>
                  <p className="text-xl font-extrabold text-primary-orange">₹{reportData.summary.totalGstAmount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-muted uppercase tracking-wider mb-1">GST Rate</p>
                  <p className="text-xl font-extrabold text-primary-navy">{reportData.summary.gstRatePercent || 18}%</p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-neutral-muted/20">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-dark uppercase bg-neutral-muted/10 border-b border-neutral-muted/20">
                  {reportType === 'gst' ? (
                    <tr>
                      <th className="px-5 py-4 font-semibold tracking-wider">Date</th>
                      <th className="px-5 py-4 font-semibold tracking-wider">Booking ID</th>
                      <th className="px-5 py-4 font-semibold tracking-wider text-right">Total Amount</th>
                      <th className="px-5 py-4 font-semibold tracking-wider text-right">Base Amount</th>
                      <th className="px-5 py-4 font-semibold tracking-wider text-right text-primary-orange">GST Amount</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-5 py-4 font-semibold tracking-wider">Date</th>
                      <th className="px-5 py-4 font-semibold tracking-wider">Booking ID</th>
                      <th className="px-5 py-4 font-semibold tracking-wider">Partner</th>
                      <th className="px-5 py-4 font-semibold tracking-wider text-right">Total Paid</th>
                      <th className="px-5 py-4 font-semibold tracking-wider">Status</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-neutral-muted/10">
                  {reportData.itemized?.map((item: unknown, idx: number) => (
                    <tr key={idx} className="hover:bg-neutral-muted/5 transition-colors">
                      {reportType === 'gst' ? (
                        <>
                          <td className="px-5 py-4 text-neutral-dark">{new Date(item.createdAt || item.date).toLocaleDateString()}</td>
                          <td className="px-5 py-4 font-medium text-secondary-blue">{item.bookingId || "N/A"}</td>
                          <td className="px-5 py-4 text-right font-medium">₹{item.amount?.toLocaleString() || 0}</td>
                          <td className="px-5 py-4 text-right">₹{item.baseAmount?.toLocaleString() || 0}</td>
                          <td className="px-5 py-4 text-right font-bold text-primary-orange">₹{item.gstAmount?.toLocaleString() || 0}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-4 text-neutral-dark">{new Date(item.completedAt || item.date || item.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-4 font-medium text-secondary-blue">{item.bookingId || item.jobId || "N/A"}</td>
                          <td className="px-5 py-4 font-medium">{item.partnerName || item.partnerId?.substring(0,8) || "N/A"}</td>
                          <td className="px-5 py-4 text-right font-extrabold text-success">₹{item.paidAmount?.toLocaleString() || item.amount?.toLocaleString() || 0}</td>
                          <td className="px-5 py-4">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-neutral-muted/10 text-neutral-dark">
                              {item.status || "COMPLETED"}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {(!reportData.itemized || reportData.itemized.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-neutral-muted italic">
                        No records found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
