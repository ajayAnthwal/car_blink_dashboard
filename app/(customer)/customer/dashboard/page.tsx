"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getBookings, getGarageVehicles, getSupportTickets } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Car, 
  CalendarCheck, 
  HelpCircle,
  Plus,
  ArrowRight,
  Clock
} from "lucide-react";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    vehicles: 0,
    activeBookings: 0,
    openTickets: 0
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [vehiclesRes, bookingsRes, ticketsRes] = await Promise.all([
          getGarageVehicles(),
          getBookings(),
          getSupportTickets()
        ]);
        
        const vehiclesCount = vehiclesRes?.data?.length || 0;
        const allBookings = bookingsRes?.data || [];
        const activeBookingsCount = allBookings.filter((b: any) => !['COMPLETED', 'CANCELLED'].includes(b.status)).length;
        
        const allTickets = ticketsRes?.data || [];
        const openTicketsCount = allTickets.filter((t: any) => t.status !== 'RESOLVED').length;

        setStats({
          vehicles: vehiclesCount,
          activeBookings: activeBookingsCount,
          openTickets: openTicketsCount
        });

        // Get top 3 recent bookings
        setRecentBookings(allBookings.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Dashboard Overview</h1>
          <p className="text-neutral-muted">Welcome back, {user?.fullName || "Customer"}!</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/customer/garage">
            <Button variant="outline" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </Button>
          </Link>
          <Link href="/customer/bookings">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Book Service</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary-orange">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">My Garage</p>
                <h3 className="text-3xl font-bold text-primary-navy">{stats.vehicles}</h3>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-primary-orange" />
              </div>
            </div>
            <Link href="/customer/garage" className="mt-4 flex items-center text-sm text-primary-orange hover:underline font-medium">
              View vehicles <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary-navy">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Active Bookings</p>
                <h3 className="text-3xl font-bold text-primary-navy">{stats.activeBookings}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-primary-navy" />
              </div>
            </div>
            <Link href="/customer/bookings" className="mt-4 flex items-center text-sm text-primary-navy hover:underline font-medium">
              Manage bookings <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Open Support Tickets</p>
                <h3 className="text-3xl font-bold text-primary-navy">{stats.openTickets}</h3>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <Link href="/customer/support" className="mt-4 flex items-center text-sm text-red-500 hover:underline font-medium">
              View tickets <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Section */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-primary-navy mb-4">Recent Bookings</h2>
        <Card>
          <CardContent className="p-0">
            {recentBookings.length === 0 ? (
              <div className="p-8 text-center text-neutral-muted flex flex-col items-center">
                <CalendarCheck className="w-12 h-12 mb-3 text-neutral-muted/50" />
                <p>No recent bookings found.</p>
                <Link href="/customer/bookings">
                  <Button variant="outline" className="mt-4">Book Your First Service</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-muted/20">
                {recentBookings.map((booking, idx) => (
                  <div key={idx} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-neutral-bg transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary-navy/5 p-3 rounded-lg">
                        <Clock className="w-5 h-5 text-primary-navy" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-navy">{booking.service?.name || 'Service'}</h4>
                        <p className="text-sm text-neutral-muted flex items-center mt-1">
                          {booking.vehicle?.brand} {booking.vehicle?.model} • {new Date(booking.preferredDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 md:mt-0 flex items-center space-x-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {booking.status || 'PENDING'}
                      </span>
                      <Link href={`/customer/bookings/${booking._id || booking.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
