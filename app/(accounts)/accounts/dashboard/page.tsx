// @ts-nocheck
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAccountsDashboardData, useActivityLogs, useAccountsTransactions, useAccountsWithdrawalRequests } from "@/features/accounts/hooks/useAccountsQueries";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BadgeIndianRupee, Undo2, FileText, ArrowRight, Clock, Activity, CheckCircle2, ChevronRight, CreditCard, Wallet, ArrowUpRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function AccountsDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading: loading } = useAccountsDashboardData();
  const { data: activityLogs = [] } = useActivityLogs(5);
  const { data: txData } = useAccountsTransactions({ limit: 10 });
  const { data: withdrawalsData } = useAccountsWithdrawalRequests({ limit: 10 });
  const withdrawalList = withdrawalsData?.withdrawals || [];
  const pendingWithdrawals = useMemo(() => withdrawalList.filter((w: any) => w.status === 'PENDING'), [withdrawalList]);

  const rawTransactions = txData?.transactions || txData?.data?.transactions || (Array.isArray(txData) ? txData : []);
  const recentPayments = useMemo(() => Array.isArray(rawTransactions) ? rawTransactions.slice(0, 5) : [], [rawTransactions]);

  const stats = data?.stats || {
    pendingRefunds: 0,
    pendingSettlements: 0,
    totalRefundsAmount: 0,
    totalSettlementsAmount: 0
  };

  const recentRefunds = useMemo(() => (data?.refundsList || []).slice(0, 5), [data?.refundsList]);

  // Chart Data
  const financialVolumeData = useMemo(() => [
    { name: "Refunds", Volume: stats.totalRefundsAmount, fill: "#f97316" }, // orange-500
    { name: "Settlements", Volume: stats.totalSettlementsAmount, fill: "#1e3a8a" }, // primary-navy
  ], [stats]);

  const statusDistributionData = useMemo(() => {
    const allRefunds = data?.refundsList || [];
    const allSettlements = data?.settlementsList || [];

    const processedRefunds = allRefunds.length - stats.pendingRefunds;
    const processedSettlements = allSettlements.length - stats.pendingSettlements;

    const totalPending = stats.pendingRefunds + stats.pendingSettlements;
    const totalProcessed = processedRefunds + processedSettlements;

    const pieData = [];
    if (totalPending > 0) pieData.push({ name: "Pending", value: totalPending, color: "#f59e0b" }); // amber-500
    if (totalProcessed > 0) pieData.push({ name: "Processed/Approved", value: totalProcessed, color: "#10b981" }); // emerald-500
    return pieData;
  }, [data, stats]);

  const todayDisplay = new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="h-80 col-span-1 lg:col-span-7 rounded-xl" />
          <Skeleton className="h-80 col-span-1 lg:col-span-5 rounded-xl" />
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-heading">Accounts Dashboard</h1>
          <p className="text-gray-500 mt-1 font-body">Welcome back, {user?.fullName || "Accountant"}! • {todayDisplay}</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto font-semibold bg-primary-navy hover:bg-primary-navy-light text-white">
            <Link href="/accounts/reports">
              <FileText className="w-4 h-4 mr-2" /> Generate Report
            </Link>
          </Button>
        </div>
      </div>


      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link href="/accounts/refunds" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-orange-300 group-hover:border-orange-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">Pending Refunds</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Undo2 className="w-5 h-5 text-primary-orange" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingRefunds}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-primary-orange group-hover:text-orange-600 transition-colors">
                Process refunds <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/accounts/settlements" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-blue-300 group-hover:border-blue-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">Pending Settlements</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <BadgeIndianRupee className="w-5 h-5 text-secondary-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingSettlements}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-secondary-blue group-hover:text-blue-700 transition-colors">
                View settlements <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/accounts/refunds" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-orange-300 group-hover:border-orange-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">Total Refunds Vol.</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Undo2 className="w-5 h-5 text-primary-orange" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">₹{stats.totalRefundsAmount.toLocaleString()}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
                View refund history <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/accounts/settlements" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-blue-300 group-hover:border-blue-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">Total Settlements Vol.</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <BadgeIndianRupee className="w-5 h-5 text-secondary-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">₹{stats.totalSettlementsAmount.toLocaleString()}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
                View settlement history <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Financial Volume Chart */}
        <Card className="col-span-1 lg:col-span-7 shadow-subtle border-gray-100 flex flex-col">
          <CardHeader>
            <CardTitle>Financial Volume Overview</CardTitle>
            <CardDescription>Comparison of Refunds vs Settlements amounts</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[300px]">
            {financialVolumeData.length > 0 && financialVolumeData.some(d => d.Volume > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialVolumeData} margin={{ top: 20, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(value) => `₹${value}`} />
                  <RechartsTooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                    formatter={(value: unknown) => [`₹${Number(value).toLocaleString()}`, 'Volume']}
                  />
                  <Bar dataKey="Volume" radius={[4, 4, 0, 0]} barSize={40}>
                    {financialVolumeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                <Activity className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">No volume data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card className="col-span-1 lg:col-span-5 shadow-subtle border-gray-100 flex flex-col">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Pending vs Processed transactions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[300px] pt-4">
            {statusDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusDistributionData.map((entry, index) => (
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
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <CheckCircle2 className="w-12 h-12 mb-3 text-success/50" />
                <p className="text-sm font-medium">No status data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Partner Wallet Withdrawal Requests */}
      <Card className="shadow-subtle border-gray-100 bg-gradient-to-r from-orange-50/30 via-white to-white border-l-4 border-l-primary-orange">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary-navy">
              <Wallet className="w-5 h-5 text-primary-orange" />
              <span>Partner Wallet Withdrawal Requests ({pendingWithdrawals.length} Pending)</span>
            </CardTitle>
            <CardDescription>Live payout requests submitted by service partners</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-primary-orange hover:text-orange-700">
            <Link href="/accounts/settlements">Process in Settlements <ArrowUpRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {pendingWithdrawals.length === 0 ? (
            <div className="p-6 text-center flex flex-col items-center justify-center">
              <Wallet className="w-8 h-8 text-gray-300 mb-1" />
              <p className="text-gray-500 text-xs font-medium">No pending partner withdrawal requests.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">Partner</TableHead>
                  <TableHead className="font-semibold text-gray-700">Bank Details</TableHead>
                  <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-700">Requested On</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWithdrawals.map((w: any) => {
                  const pName = w.partnerId?.businessName || w.bankDetails?.accountHolderName || 'Partner Workshop';
                  const bank = w.bankDetails || {};

                  return (
                    <TableRow key={w._id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-bold text-xs text-primary-navy">
                        <div>{pName}</div>
                        <div className="text-[10px] text-gray-500 font-normal">ID: #{String(w._id).slice(-6)}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-gray-800">A/C: {bank.accountNumber}</div>
                        <div className="text-[10px] text-gray-500">IFSC: {bank.ifscCode} ({bank.accountHolderName})</div>
                      </TableCell>
                      <TableCell className="text-orange-600 font-extrabold text-sm">
                        ₹{w.amount?.toLocaleString('en-IN') || 0}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(w.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 px-3 shadow-2xs">
                          <Link href="/accounts/settlements">
                            Payout Now <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Customer Payments Received */}
      <Card className="shadow-subtle border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary-navy">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Recent Customer Payments Received</span>
            </CardTitle>
            <CardDescription>Live feed of customer advance (15%) and full payments</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-secondary-blue hover:text-blue-700">
            <Link href="/accounts/transactions">View All Ledger</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {recentPayments.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <CreditCard className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm font-medium">No customer payments recorded yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">Txn / Booking ID</TableHead>
                  <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                  <TableHead className="font-semibold text-gray-700">Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date & Time</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((p: any) => {
                  const custName = p.customer?.fullName || p.customerId?.fullName || 'Customer';
                  const custPhone = p.customer?.phone || p.customerId?.phone || '';
                  const bId = p.bookingId?._id || p.bookingId || p._id;
                  const isAdvance = p.paymentType === 'ADVANCE';

                  return (
                    <TableRow key={p._id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-xs text-primary-navy">
                        <div>#{String(p.transactionId || p._id).slice(-8)}</div>
                        <div className="text-[10px] text-gray-400">Booking: #{String(bId).slice(-6)}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-semibold text-gray-900">{custName}</div>
                        {custPhone && <div className="text-[10px] text-gray-500">{custPhone}</div>}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                          isAdvance ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {isAdvance ? 'ADVANCE (15%)' : (p.paymentType || 'FULL')}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-900 font-extrabold text-sm">
                        ₹{p.amount?.toLocaleString('en-IN') || 0}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(p.createdAt || p.paidAt || Date.now()).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : p.status === 'CREATED' || p.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {p.status === 'SUCCESS' ? 'SUCCESS ✓' : p.status === 'CREATED' ? 'ORDER CREATED ⏳' : (p.status || 'PENDING')}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Refunds Table */}
        <Card className="col-span-1 lg:col-span-7 shadow-subtle border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
            <div>
              <CardTitle>Recent Refunds</CardTitle>
              <CardDescription>Latest refund requests requiring attention</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary-orange hover:text-orange-600">
              <Link href="/accounts/refunds">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {recentRefunds.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <Undo2 className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No recent refunds found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">ID</TableHead>
                    <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRefunds.map((refund, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-xs">
                        #{refund._id?.slice(-6) || 'REF'}
                      </TableCell>
                      <TableCell className="text-gray-900 font-bold">
                        ₹{refund.amount?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${refund.status === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                            refund.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              refund.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                          }`}>
                          {refund.status || 'PENDING'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Notifications Widget */}
        <Card className="col-span-1 lg:col-span-5 shadow-subtle border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary-blue" />
                Latest Notifications
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-secondary-blue hover:text-blue-700">
              <Link href="/accounts/notifications">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 flex flex-col justify-center h-[280px]">
            <div className="text-center text-gray-500">
              <p className="mb-2 text-sm">You have unread system notifications!</p>
              <Button asChild variant="outline" className="mt-2 text-primary-navy border-primary-navy/20 hover:bg-primary-navy/5">
                <Link href="/accounts/notifications">Read Messages Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Activity Logs Table */}
      <Card className="shadow-subtle border-gray-100 mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
          <div>
            <CardTitle className="text-primary-navy font-bold flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary-orange" />
              <span>Recent Activity Log</span>
            </CardTitle>
            <CardDescription>System actions taken by accounts users</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {activityLogs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <p className="text-gray-500 font-medium">No activity logged yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">Timestamp</TableHead>
                  <TableHead className="font-semibold text-gray-700">Action</TableHead>
                  <TableHead className="font-semibold text-gray-700">User</TableHead>
                  <TableHead className="font-semibold text-gray-700">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.map((log: any, idx: number) => (
                  <TableRow key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-primary-navy/10 text-primary-navy">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {log.accountsId?.fullName || 'System'}
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
