"use client";

import React, { useState, useEffect } from "react";
import { getSuperAdminSettlements, markSuperAdminSettlementPaid } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, IndianRupee, CheckCircle, FileText } from "lucide-react";

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchSettlements = async () => {
    setIsLoading(true);
    try {
      const query = statusFilter ? `status=${statusFilter}` : "";
      const res = await getSuperAdminSettlements(query);
      setSettlements(res.docs || []);
    } catch (error) {
      console.error("Failed to load settlements", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [statusFilter]);

  const handleMarkPaid = async (id: string) => {
    const transactionId = prompt("Enter the Bank Transaction ID or UTR for this payout:");
    if (!transactionId) return;

    setIsUpdating(id);
    try {
      await markSuperAdminSettlementPaid(id, { transactionId });
      alert("Settlement marked as PAID successfully!");
      fetchSettlements();
    } catch (error: any) {
      alert("Failed to mark as paid.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleExportCSV = () => {
    if (settlements.length === 0) return alert("No data to export.");
    
    // Simple CSV Export logic
    const headers = ["Garage Name", "Amount", "Status", "Period Start", "Period End", "Transaction ID"];
    const csvRows = [headers.join(",")];

    settlements.forEach(s => {
      csvRows.push([
        `"${s.partnerId?.businessName || ''}"`,
        s.amount,
        s.status,
        new Date(s.periodStart).toLocaleDateString(),
        new Date(s.periodEnd).toLocaleDateString(),
        s.transactionId || 'N/A'
      ].join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `settlements_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-navy to-gray-900 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between shadow-elevated gap-4">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <IndianRupee className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Payouts & Settlements</h1>
            <p className="text-white/80 mt-1 font-medium">Manage and record payments sent to garage partners.</p>
          </div>
        </div>
        <button 
          onClick={handleExportCSV}
          className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
        >
          <FileText className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-50 bg-gray-50/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg text-primary-navy font-bold flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary-orange" /> Payout Records
            </CardTitle>
            <select 
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Payouts</option>
              <option value="PAID">Paid Settlements</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
              <p className="font-medium">Loading settlements...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Garage Partner</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Breakdown</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Net Payout</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400 font-medium">No settlements found.</td>
                    </tr>
                  ) : (
                    settlements.map((s: any) => (
                      <tr key={s._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{s.partnerId?.businessName || 'Unknown'}</div>
                          {s.jobId && <div className="text-xs text-gray-500 mt-1">Job: {s.jobId}</div>}
                          {(s.transactionReference || s.transactionId) && <div className="text-xs text-gray-500 font-mono mt-0.5">Txn: {s.transactionReference || s.transactionId}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 font-medium">
                            {new Date(s.createdAt || s.periodStart).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-1 text-gray-600 font-medium">
                            <div className="flex justify-between gap-4"><span>Gross:</span> <span className="font-bold text-gray-900">₹{(s.grossAmount || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between gap-4"><span>Comm (15%):</span> <span className="text-red-500">-₹{(s.platformCommission || 0).toFixed(2)}</span></div>
                            {(s.tdsAmount > 0 || s.otherDeductions > 0) && (
                              <>
                                <div className="flex justify-between gap-4"><span>TDS:</span> <span className="text-red-500">-₹{(s.tdsAmount || 0).toFixed(2)}</span></div>
                                <div className="flex justify-between gap-4"><span>Other Deduct:</span> <span className="text-red-500">-₹{(s.otherDeductions || 0).toFixed(2)}</span></div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-bold text-gray-900 text-lg text-green-600">₹{(s.netPayoutAmount || s.amount || 0).toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            ['PAID', 'PROCESSED'].includes(s.status) ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {s.status === 'PENDING' ? (
                            <button 
                              onClick={() => handleMarkPaid(s._id)}
                              disabled={isUpdating === s._id}
                              className="text-sm font-medium text-primary-navy hover:text-blue-700 flex items-center justify-end gap-1 ml-auto disabled:opacity-50"
                            >
                              {isUpdating === s._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-sm text-green-600 font-medium flex items-center justify-end gap-1">
                              <CheckCircle className="w-4 h-4" /> Cleared
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
