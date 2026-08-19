// @ts-nocheck
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCustomerBookings, useCustomerPayments, useCustomerWarranties, useCustomerStatsQuery, useCustomerInvoicesQuery } from "@/features/customer/hooks/useCustomerQueries";
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
  PiggyBank,
  FileText,
  Download,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const { data: bookingsData, isLoading: loadingBookings } = useCustomerBookings();
  const bookings = bookingsData?.bookings || [];

  console.log("DASHBOARD DEBUG bookings array length:", bookings.length);
  if (bookings.length > 0) {
    console.log("DASHBOARD DEBUG bookings[0] keys:", Object.keys(bookings[0]));
    console.log("DASHBOARD DEBUG bookings[0] jobDetails:", bookings[0].jobDetails);
    console.log("DASHBOARD DEBUG bookings[0] jobExtensions:", bookings[0].jobExtensions);
    console.log("DASHBOARD DEBUG bookings[0] additionalParts:", bookings[0].additionalParts);
  }
  
  const { data: paymentsData, isLoading: loadingPayments } = useCustomerPayments();
  const payments = paymentsData?.payments || [];

  const { data: warrantiesData, isLoading: loadingWarranties } = useCustomerWarranties();
  const warranties = warrantiesData?.warranties || [];

  const { data: customerStats, isLoading: loadingStats } = useCustomerStatsQuery();

  const { data: invoicesData, isLoading: loadingInvoices } = useCustomerInvoicesQuery();
  const invoices = invoicesData?.invoices || [];

  const loading = loadingBookings || loadingPayments || loadingWarranties || loadingStats;

  // Derived state computed efficiently with useMemo
  const stats = useMemo(() => {
    const activeBookingsCount = bookings.filter(b => ['PENDING', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length;
    const completedServicesCount = bookings.filter(b => b.status === 'COMPLETED').length;

    const totalSpentAmount = payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const activeWarrantiesCount = warranties.filter(w => w.status === 'ACTIVE').length;

    return {
      activeBookings: activeBookingsCount,
      completedServices: completedServicesCount,
      totalSpent: totalSpentAmount,
      activeWarranties: activeWarrantiesCount,
      totalSavings: customerStats?.totalSavings || 0,
      rewardPoints: customerStats?.rewardPoints || 0
    };
  }, [bookings, payments, warranties, customerStats]);

  const pieChartData = useMemo(() => {
    const statusCounts = bookings.reduce((acc: any, booking: Booking) => {
      const status = booking.status || 'PENDING';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(statusCounts).map(status => ({
      name: status.replace(/_/g, " "),
      value: statusCounts[status],
      color: getStatusColorTheme(status).hex
    }));
  }, [bookings]);

  const barChartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        monthKey: `${d.getFullYear()}-${d.getMonth()}`, 
        label: d.toLocaleDateString('default', { month: 'short' }), 
        spent: 0
      };
    }).reverse(); 

    payments.forEach(p => {
      if (p.status !== 'SUCCESS') return;
      const date = new Date(p.paidAt || p.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthObj = last6Months.find(m => m.monthKey === monthKey);
      if (monthObj) {
        monthObj.spent += (p.amount || 0);
      }
    });

    return last6Months;
  }, [payments]);

  const recentBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [bookings]);

  const quotesWaiting = useMemo(() => {
    return bookings.filter(b => b.status === 'QUOTED');
  }, [bookings]);

  const additionalPartsPending = useMemo(() => {
    return bookings.filter(b => {
      const bData = b as any;
      const jobExts = bData.jobDetails?.jobExtensions || bData.jobExtensions || bData.jobDetails?.extensions || [];
      const hasPendingExts = jobExts.some((ext: any) => String(ext.status || '').toUpperCase() === 'PENDING');

      const rawAddParts = bData.additionalParts || bData.pendingAdditionalParts || [];
      const hasPendingParts = Array.isArray(rawAddParts) && rawAddParts.some((part: any) => !part.status || String(part.status || '').toUpperCase() === 'PENDING');

      const isReqPending = bData.jobExtensionRequest && String(bData.jobExtensionRequest.status || '').toUpperCase() === 'PENDING';

      return hasPendingExts || hasPendingParts || isReqPending;
    });
  }, [bookings]);

  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    setTodayStr(new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 container px-4 sm:px-6 md:px-8 mx-auto pb-10">
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
    <div className="space-y-6 md:space-y-8 pb-12 container px-4 sm:px-6 md:px-8 mx-auto">
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
         
        </div>
      )}

      {/* Action Center Alerts: Pending Quotes */}
      {quotesWaiting.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 text-blue-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Action Required: Pending Quote</h3>
              <p className="text-gray-600 text-sm font-medium">You have {quotesWaiting.length} booking(s) waiting for quote approval.</p>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
            <Link href={`/customer/bookings/${quotesWaiting[0]._id}`}>Review Quote</Link>
          </Button>
        </div>
      )}

      {/* Action Center Alerts: Additional Parts Request */}
      {additionalPartsPending.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-3xl p-5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 text-purple-600">
              <Wrench className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Action Required: Extra Parts / Charges Approval</h3>
              <p className="text-gray-600 text-sm font-medium">Partner has requested approval for additional service parts for {additionalPartsPending.length} booking(s).</p>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm">
            <Link href={`/customer/bookings/${additionalPartsPending[0]._id}`}>Review Extra Parts</Link>
          </Button>
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

      {/* Additional Parts / Extra Services Section */}
      {additionalPartsPending.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-purple-600 animate-pulse" />
            Action Required: Additional Parts Approval
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalPartsPending.map((booking: any) => {
              const jobExts = booking.jobDetails?.jobExtensions || booking.jobExtensions || booking.jobDetails?.extensions || [];
              const pendingJobExts = jobExts.filter((ext: any) => String(ext.status || '').toUpperCase() === 'PENDING');

              let partsList: any[] = [];
              if (pendingJobExts.length > 0) {
                partsList = pendingJobExts.map((e: any) => ({ name: e.partName || e.description || 'Additional Part', cost: e.cost || e.amount || 0 }));
              } else {
                const rawAddParts = booking.additionalParts || booking.pendingAdditionalParts || [];
                const pendingAddParts = Array.isArray(rawAddParts) ? rawAddParts.filter((p: any) => !p.status || String(p.status || '').toUpperCase() === 'PENDING') : [];
                partsList = pendingAddParts.map((p: any) => ({ name: p.name || p.partName || p.description || 'Additional Part', cost: p.cost || p.amount || 0 }));
              }

              const totalExtra = partsList.reduce((sum: number, p: any) => sum + (p.cost || p.amount || 0), 0);
              return (
                <Card key={booking._id} className="bg-gradient-to-br from-purple-50 via-white to-purple-50/30 border border-purple-200 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">EXTRA PARTS REQUESTED</span>
                        <h3 className="font-bold text-gray-900 mt-1 text-base">{typeof booking.serviceId === 'object' ? booking.serviceId.name : 'Service Request'}</h3>
                        <p className="text-xs text-gray-500">{typeof booking.vehicleId === 'object' ? `${booking.vehicleId.brand} ${booking.vehicleId.model}` : 'Vehicle'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">Extra Amount</span>
                        <span className="text-lg font-bold text-purple-700">₹{totalExtra.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-purple-100 text-xs text-gray-600 mb-4 space-y-1">
                      {partsList.length > 0 ? (
                        partsList.map((part: any, pIdx: number) => (
                          <div key={pIdx} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                            <span className="font-medium text-gray-800">• {part.name || part.description || 'Additional Part'}</span>
                            <span className="font-semibold text-gray-900">₹{(part.cost || part.amount || 0).toLocaleString('en-IN')}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">Partner requested approval for additional service work.</p>
                      )}
                    </div>

                    <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm">
                      <Link href={`/customer/bookings/${booking._id}`}>
                        Review & Approve Extra Parts <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoices & Receipts Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center font-heading">
              <FileText className="w-5 h-5 mr-2 text-primary-orange" />
              Invoices & Service Receipts
            </h2>
            <p className="text-xs text-gray-500">Verified service invoices forwarded by your executive</p>
          </div>
          {invoices.length > 0 && (
            <span className="text-xs font-semibold bg-orange-100 text-primary-orange px-3 py-1 rounded-full">
              {invoices.length} Invoices Available
            </span>
          )}
        </div>

        {invoices.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-md p-6 text-center border-dashed border-gray-200">
            <div className="flex flex-col items-center justify-center py-4">
              <FileText className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">No invoices generated yet.</p>
              <p className="text-xs text-gray-400 mt-1">Once your service is verified and executive forwards the invoice, it will appear here for download & payment.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((inv: any) => {
              const invDate = new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              const bInfo = inv.bookingId || {};
              const vInfo = bInfo.vehicleId || {};
              const pInfo = inv.partnerId || {};

              return (
                <Card key={inv._id} className="bg-white shadow-sm border-gray-200 hover:border-primary-orange/50 hover:shadow-md transition-all">
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">INVOICE DATE</span>
                          <span className="text-xs font-medium text-gray-700">{invDate}</span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {inv.status === 'PAID' ? 'PAID' : 'READY FOR PAYMENT'}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-base mt-2 line-clamp-1">{typeof bInfo.serviceId === 'object' ? bInfo.serviceId.name : 'Car Service'}</h3>
                      <p className="text-xs text-gray-500 font-medium">{vInfo.brand} {vInfo.model} • {vInfo.registrationNumber || 'Vehicle'}</p>
                      <p className="text-xs text-gray-400 mt-1">Partner: {pInfo.businessName || 'Verified Garage'}</p>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-baseline">
                        <span className="text-xs text-gray-500 font-medium">Grand Total</span>
                        <span className="text-xl font-extrabold text-gray-900">₹{(inv.grandTotal || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <Button
                        onClick={() => setSelectedInvoice(inv)}
                        className="flex-1 bg-primary-orange hover:bg-primary-orange-dark text-white font-semibold text-xs py-2 rounded-xl shadow-sm"
                      >
                        View & Print Invoice
                      </Button>
                      {(inv.pdfUrl || inv.pdf || inv.pdfDocument || inv.invoiceUrl) && (
                        <Button
                          asChild
                          variant="outline"
                          className="border-gray-200 text-gray-700 hover:bg-gray-50 text-xs py-2 rounded-xl flex items-center gap-1 font-bold"
                        >
                          <a href={inv.pdfUrl || inv.pdf || inv.pdfDocument || inv.invoiceUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-3.5 h-3.5 text-primary-orange" /> Open PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Quotes Section */}
      {quotesWaiting.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <BellRing className="w-5 h-5 mr-2 text-primary-orange animate-bounce" />
            Action Required: Pending Quotes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotesWaiting.map((booking) => (
              <Card key={booking._id} className="bg-white/90 backdrop-blur-md shadow-sm border-orange-200 hover:border-primary-orange/50 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-orange"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ID: {booking._id.substring(booking._id.length - 6).toUpperCase()}</p>
                      <h3 className="font-bold text-gray-900 line-clamp-1">{typeof booking.serviceId === 'object' ? booking.serviceId.name : 'Service'}</h3>
                    </div>
                    <StatusBadge status="QUOTED" />
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <Car className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="line-clamp-1">{typeof booking.vehicleId === 'object' ? `${booking.vehicleId.brand} ${booking.vehicleId.model}` : 'Your Vehicle'}</span>
                  </div>
                  <Button asChild className="w-full bg-primary-orange hover:bg-primary-orange-dark text-white font-semibold shadow-sm group-hover:shadow transition-all duration-300">
                    <Link href={`/customer/bookings/${booking._id}`}>
                      Review & Accept Quote <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-heading">
                            {typeof booking.serviceId === 'object' ? booking.serviceId.name : 'Service Appointment'}
                          </span>
                          {booking.assignedExecutiveId && typeof booking.assignedExecutiveId === 'object' && (
                            <div className="text-[10px] uppercase font-bold tracking-wider text-secondary-blue mt-1.5 border border-secondary-blue/30 bg-secondary-blue/10 px-2 py-0.5 rounded-md inline-flex items-center w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary-blue mr-1.5"></span>
                              Assigned to {booking.assignedExecutiveId.fullName} (Executive)
                            </div>
                          )}
                          {booking.assignedPartnerId && typeof booking.assignedPartnerId === 'object' && (
                            <div className="text-[10px] uppercase font-bold tracking-wider text-success mt-1.5 border border-success/30 bg-success/10 px-2 py-0.5 rounded-md inline-flex items-center w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5"></span>
                              Assigned to {booking.assignedPartnerId.businessName} (Partner)
                            </div>
                          )}
                        </div>
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
