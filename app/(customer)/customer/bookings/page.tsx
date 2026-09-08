// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Calendar, 
  Loader2, 
  Plus, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Wrench, 
  Car,
  CalendarCheck,
  ChevronLeft,
  Search
} from "lucide-react";
import { useCustomerBookings } from "@/features/customer/hooks/useCustomerQueries";

export default function BookingsPage() {
  const router = useRouter();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 10;
  
  const { data: bookingsData, isLoading: isLoadingBookings } = useCustomerBookings({ page: currentPage, limit, search: searchQuery });
  const allBookings = bookingsData?.bookings || [];
  
  const filteredBookings = allBookings.filter((booking: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const serviceName = typeof booking.serviceId === 'object' ? booking.serviceId.name : 'Car Service';
    const vehicleText = typeof booking.vehicleId === 'object' ? `${booking.vehicleId.brand} ${booking.vehicleId.model}` : '';
    const cityName = booking.cityId && typeof booking.cityId === 'object' ? booking.cityId.name : (booking.city || '');
    const statusText = booking.status || '';
    return (
      serviceName.toLowerCase().includes(query) ||
      vehicleText.toLowerCase().includes(query) ||
      cityName.toLowerCase().includes(query) ||
      statusText.toLowerCase().includes(query)
    );
  });

  const totalBookings = bookingsData?.total || filteredBookings.length;
  const totalPages = Math.ceil(totalBookings / limit) || 1;

  return (
    <div className="space-y-6 md:space-y-8 container mx-auto px-4 sm:px-6 md:px-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Your Bookings</h2>
          <p className="text-gray-500 mt-1">Manage and track all your car service appointments.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-11 rounded-xl bg-white border-gray-200 text-sm focus:ring-primary-orange"
            />
          </div>
          <Button asChild className="font-semibold bg-primary-orange hover:bg-primary-orange-dark text-white rounded-xl shadow-sm text-sm h-11 px-5 w-full sm:w-auto">
            <Link href="/customer/bookings/new" className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Bookings List Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-subtle border border-gray-100 overflow-hidden">
        {isLoadingBookings ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">Loading your bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 sm:p-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <CalendarCheck className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-heading mb-2">No Bookings Found</h3>
            <p className="text-gray-500 font-medium max-w-sm mb-6 text-sm">
              {searchQuery ? `No bookings matching "${searchQuery}".` : "You haven't created any service bookings yet. Click below to request your first service!"}
            </p>
            <Button asChild className="bg-primary-orange hover:bg-primary-orange-dark text-white font-semibold rounded-xl text-xs h-10 px-6">
              <Link href="/customer/bookings/new">
                <Plus className="w-4 h-4 mr-2" /> New Booking Request
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Service</th>
                  <th className="py-4 px-6">Vehicle</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBookings.map((booking) => {
                  const bookingId = booking._id || booking.id;
                  const serviceName = typeof booking.serviceId === 'object' ? booking.serviceId.name : 'Car Service';
                  const cityName = booking.cityId && typeof booking.cityId === 'object' ? booking.cityId.name : (booking.city || '');
                  const vehicleText = typeof booking.vehicleId === 'object' ? `${booking.vehicleId.brand} ${booking.vehicleId.model}` : 'Vehicle Details';
                  const dateText = booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString('en-US') : 'N/A';

                  return (
                    <tr
                      key={bookingId}
                      onClick={() => router.push(`/customer/bookings/${bookingId}`)}
                      className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-5 px-6 font-semibold">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-heading text-sm group-hover:text-primary-orange transition-colors">
                            {serviceName}
                          </span>
                          {cityName && (
                            <span className="text-xs text-gray-400 font-normal flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {cityName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6 text-sm font-semibold text-gray-700">
                        {vehicleText}
                      </td>
                      <td className="py-5 px-6 text-sm font-medium text-gray-600">
                        {dateText}
                      </td>
                      <td className="py-5 px-6">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="py-5 px-6 text-right">
                        <Button 
                          size="sm"
                          className="bg-primary-orange hover:bg-primary-orange-dark text-white font-semibold text-xs rounded-lg px-4 py-1.5 h-8 shadow-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/customer/bookings/${bookingId}`);
                          }}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-xs font-semibold text-gray-600">
            <span>Showing page {currentPage} of {totalPages}</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="h-8 text-xs border-gray-200"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="h-8 text-xs border-gray-200"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
