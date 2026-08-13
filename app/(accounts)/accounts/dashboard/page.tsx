// @ts-nocheck
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAccountsDashboardData, useActivityLogs } from "@/features/accounts/hooks/useAccountsQueries";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BadgeIndianRupee,
  Undo2,
  FileText,
  ArrowRight,
  Clock,
  Activity,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
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
        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Refunds</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Undo2 className="w-5 h-5 text-primary-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingRefunds}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/accounts/refunds" className="flex items-center text-xs font-semibold text-primary-orange hover:text-orange-600 group transition-colors">
              Process refunds <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Settlements</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <BadgeIndianRupee className="w-5 h-5 text-secondary-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingSettlements}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/accounts/settlements" className="flex items-center text-xs font-semibold text-secondary-blue hover:text-blue-700 group transition-colors">
              View settlements <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Refunds Vol.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">₹{stats.totalRefundsAmount.toLocaleString()}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <span className="text-xs font-medium text-gray-400">Total value processed</span>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Settlements Vol.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">₹{stats.totalSettlementsAmount.toLocaleString()}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <span className="text-xs font-medium text-gray-400">Total value processed</span>
          </CardFooter>
        </Card>
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

      {/* Recent Refunds Table */}
      <Card className="shadow-subtle border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
          <div>
            <CardTitle>Recent Refunds</CardTitle>
            <CardDescription>Latest refund requests requiring attention</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-primary-orange hover:text-orange-600">
            <Link href="/accounts/refunds">View All Refunds</Link>
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
                  <TableHead className="font-semibold text-gray-700">Refund ID</TableHead>
                  <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRefunds.map((refund, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="bg-orange-50 rounded-lg p-1.5 shrink-0">
                          <FileText className="w-4 h-4 text-primary-orange" />
                        </div>
                        <span className="text-gray-900 font-bold uppercase">#{refund._id?.slice(-6) || 'REF'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 font-bold">
                      ₹{refund.amount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {new Date(refund.createdAt || new Date()).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${refund.status === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                          refund.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            refund.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                        }`}>
                        {refund.status || 'PENDING'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-semibold">
                        <Link href="/accounts/refunds">
                          Manage <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
