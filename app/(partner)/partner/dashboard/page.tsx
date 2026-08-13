// @ts-nocheck
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  IndianRupee,
  Star,
  AlertTriangle
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getStatusColorTheme, StatusBadge } from "@/components/ui/status-badge";
import {
  usePartnerJobs,
  usePartnerBids,
  usePartnerEarnings,
  usePartnerProfile,
  usePartnerLeads
} from "@/features/partner/hooks/usePartnerQueries";

export default function PartnerDashboardPage() {
  const { user } = useAuth();

  const { data: jobsData, isLoading: isLoadingJobs } = usePartnerJobs();
  const { data: bidsData, isLoading: isLoadingBids } = usePartnerBids();
  const { data: earnings, isLoading: isLoadingEarnings } = usePartnerEarnings();
  const { data: profile, isLoading: isLoadingProfile } = usePartnerProfile();
  const { data: leadsData, isLoading: isLoadingLeads } = usePartnerLeads();

  const loading = isLoadingJobs || isLoadingBids || isLoadingEarnings || isLoadingProfile || isLoadingLeads;

  const jobs = jobsData?.jobs || [];
  const bids = bidsData?.bids || [];
  const leads = leadsData?.leads || [];

  const stats = useMemo(() => {
    const activeJobsCount = jobs.filter(j => ['NOT_STARTED', 'IN_PROGRESS'].includes(j.status)).length;
    const completedJobsCount = jobs.filter(j => j.status === 'COMPLETED').length;
    const totalEarned = (earnings as unknown)?.lifetimeEarnings || earnings?.totalEarnings || 0;
    const avgRating = profile?.rating || 0;
    const tReviews = profile?.totalReviews || 0;

    return {
      activeJobs: activeJobsCount,
      completedJobs: completedJobsCount,
      totalEarnings: totalEarned,
      averageRating: avgRating,
      totalReviews: tReviews
    };
  }, [jobs, earnings, profile]);

  const lineChartData = useMemo(() => {
    if (earnings?.monthlyTrend && earnings.monthlyTrend.length > 0) {
      return earnings.monthlyTrend;
    }
    
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        monthKey: `${d.getFullYear()}-${d.getMonth()}`,
        name: d.toLocaleDateString('default', { month: 'short' }),
        earnings: 0
      };
    }).reverse();

    jobs.forEach(j => {
      if (j.status === 'COMPLETED' && j.completedAt) {
        const date = new Date(j.completedAt);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthObj = last6Months.find(m => m.monthKey === monthKey);
        if (monthObj) {
          monthObj.earnings += (j.finalAmount || 0);
        }
      }
    });
    return last6Months;
  }, [earnings, jobs]);

  const barChartData = useMemo(() => {
    const statusCounts = jobs.reduce((acc: unknown, job: unknown) => {
      const status = job.status || 'NOT_STARTED';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0 });

    return [
      { name: "Not Started", value: statusCounts.NOT_STARTED, fill: getStatusColorTheme("NOT_STARTED").hex },
      { name: "In Progress", value: statusCounts.IN_PROGRESS, fill: getStatusColorTheme("IN_PROGRESS").hex },
      { name: "Completed", value: statusCounts.COMPLETED, fill: getStatusColorTheme("COMPLETED").hex }
    ];
  }, [jobs]);

  const unbidLeads = useMemo(() => leads.filter(l => l.status === 'PENDING'), [leads]);
  const recentJobs = useMemo(() => [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [jobs]);
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="h-80 col-span-1 lg:col-span-8 rounded-xl" />
          <Skeleton className="h-80 col-span-1 lg:col-span-4 rounded-xl" />
        </div>
      </div>
    );
  }

  const isProfileIncomplete = !profile?.businessName;
  const isKycPending = profile?.verificationStatus === 'PENDING';
  const isKycUnderReview = profile?.verificationStatus === 'UNDER_REVIEW';
  const isKycRejected = profile?.verificationStatus === 'REJECTED';

  const showProfileAlert = isProfileIncomplete || isKycPending || isKycRejected;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-heading">
              {profile?.businessName || "Partner Dashboard"}
            </h1>
            {profile?.verificationStatus && (
              <StatusBadge status={profile.verificationStatus} />
            )}
          </div>
          <p className="text-gray-500 mt-1 font-body">Welcome back, {user?.fullName || "Partner"}! • {todayStr}</p>
        </div>
      </div>

      {/* KYC / Profile Alert */}
      {showProfileAlert && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isKycRejected ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full mr-3 shrink-0 ${isKycRejected ? 'bg-red-100' : 'bg-orange-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${isKycRejected ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <h3 className={`font-bold ${isKycRejected ? 'text-red-900' : 'text-orange-900'}`}>
                {isProfileIncomplete ? "Profile Incomplete" : isKycRejected ? "KYC Rejected" : "KYC Verification Pending"}
              </h3>
              <p className={`text-sm font-medium mt-0.5 ${isKycRejected ? 'text-red-700' : 'text-orange-800'}`}>
                {isProfileIncomplete 
                  ? "Please complete your business profile to start receiving leads." 
                  : isKycRejected 
                    ? "Your KYC documents were rejected. Please check your profile and re-upload valid documents."
                    : "Please upload your KYC documents in your profile to get verified and prevent fraud."}
              </p>
            </div>
          </div>
          <Button asChild size="sm" className={isKycRejected ? "bg-red-600 hover:bg-red-700 text-white shrink-0" : "bg-orange-600 hover:bg-orange-700 text-white shrink-0"}>
            <Link href="/partner/profile">Update Profile</Link>
          </Button>
        </div>
      )}

      {/* Active Leads Callout */}
      {unbidLeads.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="bg-secondary-blue/20 p-2 rounded-full mr-3 shrink-0">
              <Briefcase className="w-5 h-5 text-secondary-blue" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">New Leads Available!</h3>
              <p className="text-sm text-gray-600 font-medium mt-0.5">There are {unbidLeads.length} new service request(s) waiting for bids in your area.</p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-secondary-blue hover:bg-blue-700 text-white shrink-0">
            <Link href="/partner/leads">View Leads & Bid</Link>
          </Button>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Active Jobs</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-secondary-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.activeJobs}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/partner/jobs" className="flex items-center text-xs font-semibold text-secondary-blue hover:text-blue-700 group transition-colors">
              Manage jobs
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Jobs</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.completedJobs}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/partner/jobs" className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              View history
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-primary-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">
              {stats.totalEarnings.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/partner/earnings" className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              View payouts
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Average Rating</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">
              {stats.averageRating ? stats.averageRating.toFixed(1) : "N/A"}
            </div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <div className="flex items-center text-xs font-semibold text-gray-500">
              Based on {stats.totalReviews} reviews
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Middle Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Earnings Trend */}
        <Card className="col-span-1 lg:col-span-8 shadow-subtle border-gray-100 flex flex-col">
          <CardHeader>
            <CardTitle>Earnings Trend</CardTitle>
            <CardDescription>Your revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[280px]">
            {lineChartData.length > 0 && lineChartData.some(d => d.earnings > 0 || (d as unknown).amount > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey={(lineChartData[0] as unknown)?.month ? "month" : "name"} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                    formatter={(value: unknown) => [
                      Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
                      'Earnings'
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey={(lineChartData[0] as unknown)?.amount !== undefined ? "amount" : "earnings"}
                    stroke="#16A34A"
                    strokeWidth={4}
                    dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#16A34A" }}
                    activeDot={{ r: 6, fill: "#16A34A", stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                <AlertTriangle className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">No earnings data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jobs by Status */}
        <Card className="col-span-1 lg:col-span-4 shadow-subtle border-gray-100 flex flex-col">
          <CardHeader>
            <CardTitle>Jobs by Status</CardTitle>
            <CardDescription>Current state of your assigned jobs</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[280px]">
            {jobs.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} width={80} />
                  <RechartsTooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="value" name="Jobs" radius={[0, 4, 4, 0]} barSize={30}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                <AlertTriangle className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">No jobs available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <Card className="shadow-subtle border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
          <div>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Your recently assigned or completed jobs</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-secondary-blue hover:text-blue-700" asChild>
            <Link href="/partner/jobs">View All</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {recentJobs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Briefcase className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No recent jobs found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">Service</TableHead>
                  <TableHead className="font-semibold text-gray-700">Vehicle</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentJobs.map((job) => {
                  const bookingObj = typeof job.bookingId === 'object' ? job.bookingId : null;
                  const serviceObj = bookingObj && typeof bookingObj.serviceId === 'object' ? bookingObj.serviceId : null;
                  const vehicleObj = bookingObj && typeof bookingObj.vehicleId === 'object' ? bookingObj.vehicleId : null;

                  return (
                    <TableRow key={job._id || job.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {serviceObj?.name || 'Service Job'}
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium">
                        {vehicleObj ? `${vehicleObj.brand} ${vehicleObj.model}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600 font-medium">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {job.finalAmount ? `₹${job.finalAmount.toLocaleString('en-IN')}` : '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
