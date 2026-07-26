"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSuperAdminBookings } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Search, Calendar, ChevronRight, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const query = statusFilter ? `status=${statusFilter}` : "";
      const res = await getSuperAdminBookings(query);
      setBookings(res.docs || []);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleExportCSV = () => {
    if (bookings.length === 0) return alert("No data to export.");
    const headers = ["Booking ID", "Customer", "Service", "Status", "Total Amount"];
    const csvRows = [headers.join(",")];
    bookings.forEach(b => {
      csvRows.push([
        b.bookingId || b._id,
        `"${b.customerId?.fullName || ''}"`,
        `"${b.serviceId?.name || ''}"`,
        b.status,
        b.totalAmount || 0
      ].join(","));
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `bookings_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-navy to-gray-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">All Bookings</h1>
            <p className="text-white/80 mt-1 font-medium">Manage and view all customer bookings.</p>
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
            <CardTitle className="text-lg text-primary-navy font-bold">Bookings List</CardTitle>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                className="w-full md:w-48 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
              <p className="font-medium">Loading bookings...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Booking ID & Date</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Customer</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Service</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400 font-medium">No bookings found.</td>
                    </tr>
                  ) : (
                    bookings.map((booking: any) => (
                      <tr key={booking._id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block">{booking._id}</div>
                          <div className="text-xs text-gray-500 mt-1">{new Date(booking.createdAt).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{booking.customerId?.fullName || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{booking.customerId?.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{booking.serviceId?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{booking.vehicleId?.make} {booking.vehicleId?.model}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            booking.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/bookings/${booking._id}`}>
                            <button className="text-primary-navy hover:text-blue-700 font-medium flex items-center justify-end gap-1 text-sm ml-auto">
                              View <ChevronRight className="w-4 h-4" />
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
