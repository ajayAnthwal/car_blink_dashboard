"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getEarningsSummary, getPartnerJobs, getLeads } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  IndianRupee, 
  Wrench, 
  Target,
  ArrowRight,
  Clock,
  CheckCircle2
} from "lucide-react";

export default function PartnerDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ totalEarnings: 0, completedJobs: 0 });
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [summaryRes, jobsRes, leadsRes] = await Promise.all([
          getEarningsSummary().catch(() => ({ data: { totalEarnings: 0, completedJobs: 0 } })),
          getPartnerJobs("STARTED", 1, 3).catch(() => ({ data: [] })),
          getLeads(1, 3).catch(() => ({ data: [] }))
        ]);
        
        setSummary(summaryRes.data || { totalEarnings: 0, completedJobs: 0 });
        setActiveJobs(jobsRes?.docs || jobsRes || []);
        setRecentLeads(leadsRes?.docs || leadsRes || []);
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
          <h1 className="text-2xl font-bold text-primary-navy">Partner Dashboard</h1>
          <p className="text-neutral-muted">Welcome back, {user?.fullName || "Partner"}!</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/partner/leads">
            <Button className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Find New Leads</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Lifetime Earnings</p>
                <h3 className="text-3xl font-bold text-primary-navy">₹{summary.totalEarnings || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <Link href="/partner/earnings" className="mt-4 flex items-center text-sm text-green-600 hover:underline font-medium">
              View earnings report <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary-navy">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Completed Jobs</p>
                <h3 className="text-3xl font-bold text-primary-navy">{summary.completedJobs || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary-navy" />
              </div>
            </div>
            <Link href="/partner/jobs" className="mt-4 flex items-center text-sm text-primary-navy hover:underline font-medium">
              View job history <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Active Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary-navy">Active Jobs</h2>
            <Link href="/partner/jobs" className="text-sm text-primary-orange hover:underline">
              View All
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {activeJobs.length === 0 ? (
                <div className="p-8 text-center text-neutral-muted flex flex-col items-center">
                  <Wrench className="w-10 h-10 mb-3 text-neutral-muted/40" />
                  <p className="text-sm">No active jobs currently.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-muted/20">
                  {activeJobs.map((job, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-neutral-bg transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary-orange/10 p-2 rounded-lg mt-1">
                          <Wrench className="w-4 h-4 text-primary-orange" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-primary-navy">{job.bookingId?.serviceId?.name || 'Service Job'}</h4>
                          <p className="text-xs text-neutral-muted mt-1">
                            {job.bookingId?.vehicleId?.brand} {job.bookingId?.vehicleId?.model}
                          </p>
                        </div>
                      </div>
                      <Link href={`/partner/jobs`}>
                        <Button variant="outline" size="sm">Manage</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary-navy">New Leads Available</h2>
            <Link href="/partner/leads" className="text-sm text-primary-orange hover:underline">
              View All
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {recentLeads.length === 0 ? (
                <div className="p-8 text-center text-neutral-muted flex flex-col items-center">
                  <Target className="w-10 h-10 mb-3 text-neutral-muted/40" />
                  <p className="text-sm">No new leads available at the moment.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-muted/20">
                  {recentLeads.map((lead, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-neutral-bg transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary-navy/5 p-2 rounded-lg mt-1">
                          <Clock className="w-4 h-4 text-primary-navy" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-primary-navy">{lead.serviceId?.name || 'Service Request'}</h4>
                          <p className="text-xs text-neutral-muted mt-1">
                            {lead.cityId?.name} • {new Date(lead.preferredDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Link href={`/partner/leads`}>
                        <Button variant="outline" size="sm">Place Bid</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
