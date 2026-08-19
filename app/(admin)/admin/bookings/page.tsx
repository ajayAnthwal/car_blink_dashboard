// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminBookings } from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Calendar, ChevronRight, FileText, Search, ChevronLeft } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce"; // Assume this exists, or we just do simple state

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Basic debounce logic for search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: bookingsData, isLoading } = useAdminBookings(page, limit, statusFilter, debouncedSearch);
  const bookings = bookingsData?.docs || bookingsData?.data || bookingsData || [];
  const pagination = bookingsData || {};

  const handleExportCSV = () => {
    if (bookings.length === 0) return alert("No data to export.");
    const headers = ["Booking ID", "Customer", "Service", "Status", "Date", "Location"];
    const csvRows = [headers.join(",")];
    bookings.forEach(b => {
      csvRows.push([
        b.bookingId || b._id,
        `"${b.customerId?.fullName || ''}"`,
        `"${b.serviceId?.name || ''}"`,
        b.status,
        `"${new Date(b.createdAt).toLocaleString()}"`,
        `"${b.cityId?.name || 'N/A'}"`
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

  // Truncate long mongo ID for better display
  const truncateId = (id: string) => id ? `${id.substring(0, 6)}...${id.substring(id.length - 4)}` : '';

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
        <CardHeader className="border-b border-gray-50 bg-gray-50/50 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle className="text-lg text-primary-navy font-bold">Bookings List</CardTitle>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search by ID..." 
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select 
                className="w-full sm:w-48 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy transition-all"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1); // Reset page on filter
                }}
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
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">ID & Date</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Customer Info</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Service & Vehicle</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-400 font-medium">No bookings found for the applied filters.</td>
                      </tr>
                    ) : (
                      bookings.map((booking: unknown) => (
                        <tr key={booking._id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block" title={booking._id}>
                              #{truncateId(booking._id)}
                            </div>
                            <div className="text-xs text-gray-500 mt-2 font-medium">{new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="text-[10px] text-gray-400">{new Date(booking.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{booking.customerId?.fullName || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{booking.customerId?.phone}</div>
                            {booking.cityId?.name && (
                              <div className="text-xs text-primary-navy font-medium mt-1">{booking.cityId.name}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              {booking.serviceId?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 font-medium bg-gray-50 px-2 py-0.5 rounded-md inline-block">
                              {booking.vehicleId?.model ? `${booking.vehicleId.model} (${booking.vehicleId.registrationNumber || 'N/A'})` : 'No Vehicle'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              booking.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              booking.status === 'ACCEPTED' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/admin/bookings/${booking._id}`}
                              className="text-white bg-primary-navy hover:bg-blue-900 px-3 py-1.5 rounded-lg font-medium inline-flex items-center justify-center gap-1 text-xs ml-auto transition-colors shadow-sm"
                            >
                              View <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Footer */}
              {pagination.totalPages > 1 && (
                <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-gray-50/30">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{((page - 1) * limit) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(page * limit, pagination.totalDocs || 0)}</span> of <span className="font-medium text-gray-900">{pagination.totalDocs || 0}</span> bookings
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrevPage}
                      className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            pageNum === page 
                              ? 'bg-primary-navy text-white shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={!pagination.hasNextPage}
                      className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
