"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getBookings, getPaymentHistory, getWarranties, getCustomerStats } from "@/lib/services";
import { Booking, Payment, Warranty } from "@/lib/types";
import { getStatusColorTheme, StatusBadge } from "@/components/ui/status-badge";
import {
  Car,
  CalendarCheck,
  Plus,
  ArrowRight,
  Clock,
  ChevronRight,
  Wrench,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  BellRing,
  Gift,
  PiggyBank
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";

export default function CustomerDashboardPage() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedServices: 0,
    totalSpent: 0,
    totalSpent: 0,
    activeWarranties: 0,
    totalSavings: 0,
    rewardPoints: 0
  });
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Using Promise.all to fetch all required data concurrently
        const [bookingsRes, paymentsRes, warrantiesRes, statsRes] = await Promise.all([
          getBookings().catch(() => ({ data: [] })),
          getPaymentHistory().catch(() => ({ data: [] })),
          getWarranties().catch(() => ({ data: [] })),
          getCustomerStats().catch(() => ({ data: { totalSavings: 0, rewardPoints: 0 } }))
        ]);

        const allBookings: Booking[] = (Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.docs || bookingsRes?.data || []));
        const allPayments: Payment[] = (Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes?.docs || paymentsRes?.data || []));
        const allWarranties: Warranty[] = (Array.isArray(warrantiesRes) ? warrantiesRes : (warrantiesRes?.docs || warrantiesRes?.data || []));

        setBookings(allBookings);

        // 1. Compute Stats
        const activeBookingsCount = allBookings.filter(b => ['PENDING', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length;
        const completedServicesCount = allBookings.filter(b => b.status === 'COMPLETED').length;

        const totalSpentAmount = allPayments
          .filter(p => p.status === 'SUCCESS')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const activeWarrantiesCount = allWarranties.filter(w => w.status === 'ACTIVE').length;

        setStats({
          activeBookings: activeBookingsCount,
          completedServices: completedServicesCount,
          totalSpent: totalSpentAmount,
          activeWarranties: activeWarrantiesCount,
          totalSavings: statsRes?.data?.totalSavings || 0,
          rewardPoints: statsRes?.data?.rewardPoints || 0
        });

        // 2. Prepare Pie Chart Data (Bookings by Status)
        const statusCounts = allBookings.reduce((acc: any, booking: Booking) => {
          const status = booking.status || 'PENDING';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const pieData = Object.keys(statusCounts).map(status => ({
          name: status.replace(/_/g, " "),
          value: statusCounts[status],
          color: getStatusColorTheme(status).hex
        }));

        setPieChartData(pieData);

        // 3. Prepare Bar Chart Data (Spending over last 6 months)
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return {
            monthKey: `${d.getFullYear()}-${d.getMonth()}`, // For grouping
            label: d.toLocaleDateString('default', { month: 'short' }), // For display (e.g. "May")
            spent: 0
          };
        }).reverse(); // chronological order

        allPayments.forEach(p => {
          if (p.status !== 'SUCCESS') return;
          const date = new Date(p.paidAt || p.createdAt);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          const monthObj = last6Months.find(m => m.monthKey === monthKey);
          if (monthObj) {
            monthObj.spent += (p.amount || 0);
          }
        });

        setBarChartData(last6Months);

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

  // Derived state
  const recentBookings = bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const quotesWaiting = bookings.filter(b => b.status === 'QUOTED');

  const todayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  const isCompletelyEmpty = bookings.length === 0;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {isCompletelyEmpty && (
        <div className="bg-gradient-to-r from-orange-50 via-white to-orange-50/50 border border-orange-100/50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-orange-100 rotate-3">
              <Car className="w-8 h-8 text-primary-orange -rotate-3" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-heading tracking-tight">Welcome to CarBlink Dashboard!</h2>
              <p className="text-gray-600 mt-1 font-medium">Your premium dashboard is ready. Start by adding a vehicle to unlock full insights.</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button asChild variant="outline" className="flex-1 md:flex-none font-semibold bg-white border-gray-200">
              <Link href="/customer/garage"><Plus className="w-4 h-4 mr-2" /> Add Vehicle</Link>
            </Button>
            <Button asChild className="flex-1 md:flex-none font-semibold bg-primary-orange hover:bg-primary-orange-dark text-white">
              <Link href="/customer/bookings"><CalendarCheck className="w-4 h-4 mr-2" /> Book Service</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-heading">Overview</h1>
          <p className="text-gray-500 mt-1 font-body">Welcome back, {user?.fullName || "Customer"}! • {todayStr}</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto font-semibold bg-primary-orange hover:bg-primary-orange-dark text-white">
            <Link href="/customer/bookings">
              <Plus className="w-4 h-4 mr-2" /> Book Service
            </Link>
          </Button>
        </div>
      </div>

      {/* Actionable Callout for Quotes */}
      {quotesWaiting.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center">
            <div className="bg-primary-orange/20 p-2 rounded-full mr-3 shrink-0">
              <BellRing className="w-5 h-5 text-primary-orange" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Quotes ready for review</h3>
              <p className="text-sm text-gray-600 font-medium mt-0.5">You have {quotesWaiting.length} booking(s) with quotes waiting for your approval.</p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-primary-orange hover:bg-primary-orange-dark text-white shrink-0">
            <Link href="/customer/bookings">Review Quotes</Link>
          </Button>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Active Bookings</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-secondary-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.activeBookings}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/customer/bookings" className="flex items-center text-xs font-semibold text-secondary-blue hover:text-blue-700 group transition-colors">
              View active <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Services</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.completedServices}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/customer/bookings" className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 group transition-colors">
              History <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Spent</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-primary-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">
              {stats.totalSpent.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/customer/payments" className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 group transition-colors">
              View payments <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Active Warranties</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.activeWarranties}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/customer/warranty" className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 group transition-colors">
              View warranties <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        {/* Savings Card */}
        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Savings</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">
              {stats.totalSavings.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <span className="text-xs font-semibold text-gray-500">
              Lifetime savings
            </span>
          </CardFooter>
        </Card>

        {/* Rewards Card */}
        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Reward Points</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Gift className="w-5 h-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.rewardPoints}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/customer/referrals" className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 group transition-colors">
              Earn more <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Chart */}
        <Card className="bg-white/90 backdrop-blur-md shadow-sm border-white/40 flex flex-col hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Breakdown of all your services</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                    itemStyle={{ color: '#111827', fontWeight: 600 }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                <AlertCircle className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">No booking data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending Chart */}
        <Card className="bg-white/90 backdrop-blur-md shadow-sm border-white/40 flex flex-col hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
            <CardDescription>Your service expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[250px] pt-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <RechartsTooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                  formatter={(value: any) => [
                    Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
                    'Spent'
                  ]}
                />
                <Bar dataKey="spent" name="Spent" fill="#FF7A1A" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="bg-white/90 backdrop-blur-md shadow-sm border-white/40 hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
          <div>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Your latest service appointments</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-secondary-blue hover:text-blue-700">
            <Link href="/customer/bookings">View All</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">Service</TableHead>
                <TableHead className="font-semibold text-gray-700">Vehicle</TableHead>
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                        <CalendarCheck className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">No recent bookings found. Your activity will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentBookings.map((booking) => (
                  <TableRow key={booking._id || booking.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-gray-900 font-heading">
                          {typeof booking.serviceId === 'object' ? booking.serviceId.name : 'Service Appointment'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 font-medium">
                      {typeof booking.vehicleId === 'object' ? `${booking.vehicleId.brand} ${booking.vehicleId.model}` : 'Vehicle'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600 font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {new Date(booking.preferredDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-semibold">
                        <Link href={`/customer/bookings/${booking._id || booking.id}`}>
                          Details <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
