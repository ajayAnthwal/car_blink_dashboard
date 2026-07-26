"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSuperAdminPartners } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Store, ChevronRight, FileText } from "lucide-react";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const query = statusFilter ? `verificationStatus=${statusFilter}` : "";
      const res = await getSuperAdminPartners(query);
      setPartners(res.docs || []);
    } catch (error) {
      console.error("Failed to load partners", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [statusFilter]);

  const handleExportCSV = () => {
    if (partners.length === 0) return alert("No data to export.");
    const headers = ["Garage Name", "Owner Name", "Phone", "Status", "Joined At"];
    const csvRows = [headers.join(",")];
    partners.forEach(p => {
      csvRows.push([
        `"${p.businessName || ''}"`,
        `"${p.userId?.fullName || ''}"`,
        `"${p.userId?.phone || ''}"`,
        p.verificationStatus,
        new Date(p.createdAt).toLocaleDateString()
      ].join(","));
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `partners_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-navy to-gray-900 rounded-3xl p-6 flex items-center justify-between shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Partner Garages</h1>
            <p className="text-white/80 mt-1 font-medium">Manage KYC verifications and garage details.</p>
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
            <CardTitle className="text-lg text-primary-navy font-bold">Partners List</CardTitle>
            <select 
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending KYC</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
              <p className="font-medium">Loading partners...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Business Info</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Location</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Owner Contact</th>
                    <th className="px-6 py-4 font-bold tracking-wider">KYC Status</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {partners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400 font-medium">No partners found.</td>
                    </tr>
                  ) : (
                    partners.map((partner: any) => (
                      <tr key={partner._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{partner.businessName}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{partner.businessAddress}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{partner.cityId?.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{partner.userId?.fullName}</div>
                          <div className="text-xs text-gray-500">{partner.userId?.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            partner.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            partner.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {partner.verificationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/partners/${partner._id}`}>
                            <button className="text-primary-navy hover:text-blue-700 font-medium flex items-center justify-end gap-1 text-sm ml-auto">
                              Review <ChevronRight className="w-4 h-4" />
                            </button>
                          </Link>
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
