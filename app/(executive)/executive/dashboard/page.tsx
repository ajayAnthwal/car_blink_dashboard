"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getPendingFollowUps, getEscalations, getExecutiveLeads } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  PhoneCall, 
  AlertTriangle, 
  Target,
  ArrowRight,
  Clock,
  User,
  Users,
  Briefcase
} from "lucide-react";

export default function ExecutiveDashboardPage() {
  const { user } = useAuth();
  const [pendingFollowUps, setPendingFollowUps] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [unassignedLeads, setUnassignedLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [followUpsRes, escalationsRes, leadsRes] = await Promise.all([
          getPendingFollowUps(1, 5).catch(() => ({ data: [] })),
          getEscalations(1, 5, "status=OPEN").catch(() => ({ data: [] })),
          getExecutiveLeads(1, 5, "status=PENDING").catch(() => ({ data: [] }))
        ]);
        
        setPendingFollowUps(followUpsRes?.docs || followUpsRes || []);
        setEscalations(escalationsRes?.docs || escalationsRes || []);
        setUnassignedLeads(leadsRes?.docs || leadsRes || []);
      } catch (error) {
        console.error("Failed to fetch executive dashboard data:", error);
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Executive Dashboard</h1>
          <p className="text-neutral-muted">Welcome back, {user?.fullName || "Executive"}!</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/executive/follow-ups/pending">
            <Button className="flex items-center space-x-2 bg-secondary-blue hover:bg-secondary-blue/90">
              <PhoneCall className="w-4 h-4" />
              <span>Start Follow-ups</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-warning">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Pending Follow-ups</p>
                <h3 className="text-3xl font-bold text-primary-navy">{pendingFollowUps.length || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
            <Link href="/executive/follow-ups/pending" className="mt-4 flex items-center text-sm text-warning hover:underline font-medium">
              View all pending <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-danger">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Open Escalations</p>
                <h3 className="text-3xl font-bold text-primary-navy">{escalations.length || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
            </div>
            <Link href="/executive/escalations" className="mt-4 flex items-center text-sm text-danger hover:underline font-medium">
              Review escalations <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Unassigned Leads</p>
                <h3 className="text-3xl font-bold text-primary-navy">{unassignedLeads.length || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-success" />
              </div>
            </div>
            <Link href="/executive/leads" className="mt-4 flex items-center text-sm text-success hover:underline font-medium">
              Assign leads <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Pending Follow-ups */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary-navy">Action Required: Follow-ups</h2>
            <Link href="/executive/follow-ups/pending" className="text-sm text-primary-orange hover:underline">
              View All
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {pendingFollowUps.length === 0 ? (
                <div className="p-8 text-center text-neutral-muted flex flex-col items-center">
                  <PhoneCall className="w-10 h-10 mb-3 text-neutral-muted/40" />
                  <p className="text-sm">No pending follow-ups right now.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-muted/20">
                  {pendingFollowUps.map((followUp, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-neutral-bg transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary-navy/5 p-2 rounded-lg mt-1">
                          {followUp.relatedTo === "PARTNER" ? <Briefcase className="w-4 h-4 text-primary-navy" /> : <User className="w-4 h-4 text-primary-navy" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-primary-navy">{followUp.relatedTo} Follow-up</h4>
                          <p className="text-xs text-neutral-muted mt-1">
                            Due: {new Date(followUp.followUpDate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Link href={`/executive/follow-ups/pending`}>
                        <Button variant="outline" size="sm">Call Now</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Escalations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary-navy">Priority Escalations</h2>
            <Link href="/executive/escalations" className="text-sm text-primary-orange hover:underline">
              View All
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {escalations.length === 0 ? (
                <div className="p-8 text-center text-neutral-muted flex flex-col items-center">
                  <AlertTriangle className="w-10 h-10 mb-3 text-neutral-muted/40" />
                  <p className="text-sm">No open escalations.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-muted/20">
                  {escalations.map((esc, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-neutral-bg transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg mt-1 ${esc.severity === 'CRITICAL' || esc.severity === 'HIGH' ? 'bg-danger/10' : 'bg-warning/10'}`}>
                          <AlertTriangle className={`w-4 h-4 ${esc.severity === 'CRITICAL' || esc.severity === 'HIGH' ? 'text-danger' : 'text-warning'}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-primary-navy line-clamp-1">{esc.description}</h4>
                          <div className="flex items-center text-xs text-neutral-muted mt-1 space-x-2">
                            <span>Raised by: {esc.raisedBy}</span>
                            <span>•</span>
                            <span className="font-medium">{esc.severity}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/executive/escalations`}>
                        <Button variant="outline" size="sm">Resolve</Button>
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
