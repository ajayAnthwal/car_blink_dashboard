"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  FileText, 
  Calendar, 
  IndianRupee,
  ChevronDown,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
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
import { getPartnerJobs, getPartnerBids, getEarningsSummary, getPartnerProfile, getLeads } from "@/lib/services";
import { Job, Bid, Lead, PartnerProfile, EarningsSummary } from "@/lib/types";
import { getStatusColorTheme, StatusBadge } from "@/components/ui/status-badge";

export default function PartnerDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);

  const [stats, setStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0
  });

  const [lineChartData, setLineChartData] = useState<any[]>([]);
  const [barChartData, setBarChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [jobsRes, bidsRes, earningsRes, profileRes, leadsRes] = await Promise.all([
          getPartnerJobs().catch(() => ({ docs: [], data: [] })),
          getPartnerBids().catch(() => ({ docs: [], data: [] })),
          getEarningsSummary().catch(() => ({ data: null })),
          getPartnerProfile().catch(() => ({ data: null })),
          getLeads().catch(() => ({ docs: [], data: [] }))
        ]);

        const allJobs: Job[] = jobsRes?.docs || jobsRes?.data || [];
        const allBids: Bid[] = bidsRes?.docs || bidsRes?.data || [];
        const earningsData: EarningsSummary = earningsRes?.data;
        const profileData: PartnerProfile = profileRes?.data;
        const allLeads: Lead[] = leadsRes?.docs || leadsRes?.data || [];

        setJobs(allJobs);
        setBids(allBids);
        setEarnings(earningsData);
        setProfile(profileData);
        setLeads(allLeads);

        // 1. Compute Stats
        const activeJobsCount = allJobs.filter(j => ['NOT_STARTED', 'IN_PROGRESS'].includes(j.status)).length;
        const completedJobsCount = allJobs.filter(j => j.status === 'COMPLETED').length;
        const totalEarned = earningsData?.totalEarnings || 0;
        const avgRating = profileData?.rating || 0;
        const tReviews = profileData?.totalReviews || 0;

        setStats({
          activeJobs: activeJobsCount,
          completedJobs: completedJobsCount,
          totalEarnings: totalEarned,
          averageRating: avgRating,
          totalReviews: tReviews
        });

        // 2. Prepare Earnings Line Chart
        if (earningsData?.monthlyTrend) {
          setLineChartData(earningsData.monthlyTrend);
        } else {
          // Fallback aggregation from completed jobs if endpoint doesn't return trend
          const last6Months = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return {
              monthKey: `${d.getFullYear()}-${d.getMonth()}`,
              name: d.toLocaleDateString('default', { month: 'short' }),
              earnings: 0
            };
          }).reverse();

          allJobs.forEach(j => {
            if (j.status === 'COMPLETED' && j.completedAt) {
              const date = new Date(j.completedAt);
              const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
              const monthObj = last6Months.find(m => m.monthKey === monthKey);
              if (monthObj) {
                monthObj.earnings += (j.finalAmount || 0);
              }
            }
          });
          setLineChartData(last6Months);
        }

        // 3. Prepare Jobs Bar Chart
        const statusCounts = allJobs.reduce((acc: any, job: Job) => {
          const status = job.status || 'NOT_STARTED';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0 });

        setBarChartData([
          { name: "Not Started", value: statusCounts.NOT_STARTED, fill: getStatusColorTheme("NOT_STARTED").hex },
          { name: "In Progress", value: statusCounts.IN_PROGRESS, fill: getStatusColorTheme("IN_PROGRESS").hex },
          { name: "Completed", value: statusCounts.COMPLETED, fill: getStatusColorTheme("COMPLETED").hex }
        ]);

      } catch (error) {
        console.error("Failed to fetch partner dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Derived state
  const unbidLeads = leads.filter(l => l.status === 'PENDING');
  const recentJobs = jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
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

  // Empty State (Zero jobs/bids ever)
  if (jobs.length === 0 && bids.length === 0) {
    return (
      <div className="space-y-6 pb-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-heading">Partner Dashboard</h1>
            <p className="text-gray-500 mt-1 font-body">Welcome, {user?.fullName || "Partner"}!</p>
          </div>
        </div>
        <div className="mt-10 bg-white rounded-2xl shadow-subtle border border-gray-100 p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Briefcase className="w-10 h-10 text-secondary-blue" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">Ready to grow your business?</h2>
          <p className="text-gray-500 mb-8 font-body max-w-md">You haven't completed any jobs yet. Check out the active leads in your area and place your first bid to win a job!</p>
          <Button asChild className="font-semibold bg-secondary-blue hover:bg-blue-700 text-white px-8 h-12">
            <Link href="/partner/leads">Find New Leads</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 animate-in fade-in duration-500">
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

      {/* Active Leads Callout */}
      {unbidLeads.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
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
            {lineChartData.length > 0 && lineChartData.some(d => d.earnings > 0 || d.amount > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey={lineChartData[0]?.month ? "month" : "name"} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6B7280' }} 
                    tickFormatter={(val) => `₹${val/1000}k`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                    formatter={(value: any) => [
                      Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
                      'Earnings'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={lineChartData[0]?.amount !== undefined ? "amount" : "earnings"} 
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
