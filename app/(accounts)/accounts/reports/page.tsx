"use client";

import React, { useState } from "react";
import { getGstReport, getInvoicesReport } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileBarChart, Download, Loader2 } from "lucide-react";

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cityId, setCityId] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [isLoadingGst, setIsLoadingGst] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleDownload = async (type: "gst" | "invoice") => {
    if (!fromDate || !toDate) {
      setMessage({ type: "error", text: "Please select both From and To dates." });
      return;
    }

    setMessage({ type: "", text: "" });
    if (type === "gst") setIsLoadingGst(true);
    else setIsLoadingInvoice(true);

    try {
      let res;
      if (type === "gst") {
        res = await getGstReport(fromDate, toDate);
      } else {
        res = await getInvoicesReport(fromDate, toDate, cityId, serviceId);
      }
      
      // Simulate download link or process data
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${type}_report_${fromDate}_to_${toDate}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      setMessage({ type: "success", text: `${type.toUpperCase()} Report downloaded successfully.` });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || `Failed to download ${type.toUpperCase()} report.` });
    } finally {
      if (type === "gst") setIsLoadingGst(false);
      else setIsLoadingInvoice(false);
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
              onClick={() => handleDownload("gst")}
              isLoading={isLoadingGst}
            >
              <Download className="w-4 h-4 mr-2" /> Download GST JSON
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
              onClick={() => handleDownload("invoice")}
              isLoading={isLoadingInvoice}
            >
              <Download className="w-4 h-4 mr-2" /> Download Invoices JSON
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
