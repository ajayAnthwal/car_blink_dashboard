// @ts-nocheck
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { 
  usePendingFollowUps, 
  useEscalations, 
  useExecutiveLeads, 
  useWebsiteLeads 
} from "@/features/executive/hooks/useExecutiveQueries";
import { useSocket } from "@/lib/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { Escalation, Lead } from "@/lib/types";
import { getStatusColorTheme, StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  PhoneCall, 
  AlertTriangle, 
  Target,
  ArrowRight,
  Clock,
  User,
  Activity,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  X
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

export default function ExecutiveDashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [liveLeadAlert, setLiveLeadAlert] = React.useState<any>(null);
  
  const { data: followUpsData, isLoading: loadingFollowUps } = usePendingFollowUps({ page: 1, limit: 100 });
  const { data: escalationsData, isLoading: loadingEscalations } = useEscalations({ page: 1, limit: 100 });
  const { data: leadsData, isLoading: loadingLeads } = useExecutiveLeads({ page: 1, limit: 100 });
  const { data: websiteLeadsData, isLoading: loadingWebsiteLeads } = useWebsiteLeads({ page: 1, limit: 100 });

  // Real-time socket refresh + Live Lead Alert Trigger
  useEffect(() => {
    if (!socket) return;
    const refreshLeads = (payload?: any) => {
      queryClient.invalidateQueries({ queryKey: ["executive", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["executive", "website-leads"] });

      if (payload) {
        setLiveLeadAlert({
          id: payload?.leadId || Date.now().toString(),
          name: payload?.name || payload?.title || "New Customer",
          phone: payload?.phone || "",
          source: payload?.source ? payload.source.replace(/_/g, " ") : "Website Lead",
          city: payload?.city || payload?.location || "",
          message: payload?.message || "A new lead has arrived and requires assignment.",
          timestamp: new Date(),
          isLive: true,
        });
      }
    };
    const refreshEscalations = () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "escalations"] });
    };
    const refreshFollowUps = () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "follow-ups"] });
    };
    socket.on("new_lead", refreshLeads);
    socket.on("booking_confirmed", refreshLeads);
    socket.on("new_escalation", refreshEscalations);
    socket.on("escalation_updated", refreshEscalations);
    socket.on("follow_up_due", refreshFollowUps);
    return () => {
      socket.off("new_lead", refreshLeads);
      socket.off("booking_confirmed", refreshLeads);
      socket.off("new_escalation", refreshEscalations);
      socket.off("escalation_updated", refreshEscalations);
      socket.off("follow_up_due", refreshFollowUps);
    };
  }, [socket, queryClient]);

  const loading = loadingFollowUps || loadingEscalations || loadingLeads || loadingWebsiteLeads;

  const fUps = followUpsData?.followUps || [];
  const esc = escalationsData?.escalations || [];
  const lds = leadsData?.leads || [];
  const wLds = websiteLeadsData?.leads || [];

  // Derived Latest Incoming Lead Banner
  const latestNewLead = React.useMemo(() => {
    if (liveLeadAlert) return liveLeadAlert;

    const websiteLeadsList = Array.isArray(wLds?.docs) ? wLds.docs : (Array.isArray(wLds?.data) ? wLds.data : (Array.isArray(wLds) ? wLds : []));
    const platformLeadsList = Array.isArray(lds?.docs) ? lds.docs : (Array.isArray(lds?.data) ? lds.data : (Array.isArray(lds) ? lds : []));

    const unassignedWebsiteLeads = websiteLeadsList.filter((l: any) => l.status === "NEW" || l.status === "PENDING");
    if (unassignedWebsiteLeads.length > 0) {
      const latest = unassignedWebsiteLeads.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      return {
        id: latest._id || latest.id,
        name: latest.name || "New Customer",
        phone: latest.phone || "",
        source: latest.source ? latest.source.replace(/_/g, " ") : "Website Lead",
        city: latest.city || "",
        message: latest.message || "New enquiry received.",
        timestamp: latest.createdAt ? new Date(latest.createdAt) : new Date(),
        isLive: false,
        isWebsiteLead: true,
      };
    }

    const unassignedPlatformLeads = platformLeadsList.filter((l: any) => l.status === "PENDING" || l.status === "QUOTED");
    if (unassignedPlatformLeads.length > 0) {
      const latest = unassignedPlatformLeads.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const customerObj = typeof latest.customerId === "object" ? latest.customerId : null;
      const cityObj = typeof latest.cityId === "object" ? latest.cityId : null;
      return {
        id: latest._id || latest.id,
        name: customerObj?.fullName || "New Customer",
        phone: customerObj?.phone || "",
        source: "Platform Booking",
        city: cityObj?.name || "",
        message: latest.description || "Booking requested.",
        timestamp: latest.createdAt ? new Date(latest.createdAt) : new Date(),
        isLive: false,
        isWebsiteLead: false,
      };
    }

    return null;
  }, [liveLeadAlert, wLds, lds]);

  // Compute Stats
  const stats = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    const leadsToday = lds.filter((l: unknown) => l.createdAt && new Date(l.createdAt).toDateString() === todayStr).length;
    const websiteLeadsToday = wLds.filter((l: unknown) => l.createdAt && new Date(l.createdAt).toDateString() === todayStr).length;
    
    const openEsc = esc.filter((e: unknown) => ['OPEN', 'IN_PROGRESS'].includes(e.status)).length;
    const awaitingAssg = lds.filter((l: unknown) => ['PENDING', 'QUOTED'].includes(l.status)).length;

    return {
      totalLeadsToday: leadsToday + websiteLeadsToday,
      openEscalations: openEsc,
      pendingFollowUps: fUps.length,
      leadsAwaitingAssignment: awaitingAssg
    };
  }, [lds, wLds, esc, fUps]);

  // Prepare Leads by Status (Bar Chart)
  const leadsBarChartData = React.useMemo(() => {
    const leadStatusCounts = lds.reduce((acc: unknown, lead: Lead) => {
      const status = lead.status || 'PENDING';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { PENDING: 0, QUOTED: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 });

    return Object.keys(leadStatusCounts).map(status => ({
      name: status.replace(/_/g, " "),
      Leads: leadStatusCounts[status],
      fill: getStatusColorTheme(status).hex
    }));
  }, [lds]);

  // Prepare Escalations by Severity (Pie Chart)
  const escalationPieChartData = React.useMemo(() => {
    const openEscalationsList = esc.filter((e: unknown) => ['OPEN', 'IN_PROGRESS'].includes(e.status));
    const sevCounts = openEscalationsList.reduce((acc: unknown, e: Escalation) => {
      const sev = e.severity || 'LOW';
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 });

    return Object.keys(sevCounts).filter(k => sevCounts[k] > 0).map(sev => ({
      name: sev,
      value: sevCounts[sev],
      color: getStatusColorTheme(sev).hex
    }));
  }, [esc]);

  // Derived state
  const safeEscalations = Array.isArray(esc) ? esc : [];
  const safeLeads = Array.isArray(lds) ? lds : [];
  
  const urgentEscalations = safeEscalations.filter((e: unknown) => ['OPEN', 'IN_PROGRESS'].includes(e.status) && ['HIGH', 'CRITICAL'].includes(e.severity)).slice(0, 5);
  const recentLeads = safeLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
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

  // Empty State (Zero leads ever)
  if (safeLeads.length === 0 && safeEscalations.length === 0) {
    return (
      <div className="space-y-6 pb-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-heading">Executive Dashboard</h1>
            <p className="text-gray-500 mt-1 font-body">Welcome, {user?.fullName || "Executive"}!</p>
          </div>
        </div>
        <div className="mt-10 bg-white rounded-2xl shadow-subtle border border-gray-100 p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Activity className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">No Activity Found</h2>
          <p className="text-gray-500 font-body max-w-md">There are currently no leads, escalations, or follow-ups to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-heading">Operations Overview</h1>
          <p className="text-gray-500 mt-1 font-body">Welcome back, {user?.fullName || "Executive"}! • {todayDisplay}</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto font-semibold bg-primary-orange hover:bg-primary-orange-dark text-white">
            <Link href="/executive/follow-ups/pending">
              <PhoneCall className="w-4 h-4 mr-2" /> Start Follow-ups
            </Link>
          </Button>
        </div>
      </div>

      {/* ⚡ Live Incoming Lead Alert Banner */}
      {latestNewLead && (
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl p-5 shadow-xl shadow-orange-500/20 border border-orange-400/40 relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start space-x-3.5">
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl shrink-0 text-white mt-0.5 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white text-orange-600 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping"></span>
                    {latestNewLead.isLive ? "LIVE INCOMING LEAD" : "UNASSIGNED LEAD PENDING"}
                  </span>
                  <span className="text-xs text-orange-100 font-medium">
                    {latestNewLead.timestamp ? new Date(latestNewLead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                  </span>
                </div>
                <h3 className="font-heading font-black text-lg md:text-xl text-white mt-1">
                  {latestNewLead.name} {latestNewLead.phone ? `(${latestNewLead.phone})` : ""}
                </h3>
                <p className="text-xs md:text-sm text-orange-50 font-medium mt-0.5 line-clamp-1">
                  <strong className="text-white font-bold">Source:</strong> {latestNewLead.source} • <strong className="text-white font-bold">Location:</strong> {latestNewLead.city || "Not specified"} • {latestNewLead.message}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end md:self-center shrink-0 w-full md:w-auto">
              <Button asChild size="default" className="bg-white hover:bg-orange-50 text-orange-600 font-bold shadow-lg transition-all w-full md:w-auto">
                <Link href={latestNewLead.isWebsiteLead || latestNewLead.source !== "Platform Booking" ? "/executive/website-leads" : "/executive/leads"}>
                  View Lead & Convert <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              {latestNewLead.isLive && (
                <button 
                  onClick={() => setLiveLeadAlert(null)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                  title="Dismiss alert"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Urgent Attention Callout */}
      {urgentEscalations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="bg-danger/20 p-2 rounded-full mr-3 shrink-0">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Urgent Attention Required</h3>
              <p className="text-sm text-gray-600 font-medium mt-0.5">There are {urgentEscalations.length} High/Critical priority escalations currently open.</p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-danger hover:bg-red-700 text-white shrink-0">
            <Link href="/executive/escalations">Resolve Now</Link>
          </Button>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Leads Today</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-secondary-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.totalLeadsToday}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/executive/leads" className="flex items-center text-xs font-semibold text-secondary-blue hover:text-blue-700 group transition-colors">
              View pipeline <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Open Escalations</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.openEscalations}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/executive/escalations" className="flex items-center text-xs font-semibold text-danger hover:text-red-700 group transition-colors">
              Review issues <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Follow-ups</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingFollowUps}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/executive/follow-ups/pending" className="flex items-center text-xs font-semibold text-warning hover:text-orange-600 group transition-colors">
              Take action <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leads Status Chart */}
        <Card className="col-span-1 lg:col-span-7 shadow-subtle border-gray-100 flex flex-col">
          <CardHeader>
            <CardTitle>Platform Leads Status</CardTitle>
            <CardDescription>Current state of all incoming leads</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[300px]">
            {leadsBarChartData.length > 0 && leadsBarChartData.some(d => d.Leads > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadsBarChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} width={100} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="Leads" name="Total Leads" radius={[0, 4, 4, 0]} barSize={25}>
                    {leadsBarChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                <Target className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">No leads data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Escalations Severity Chart */}
        <Card className="col-span-1 lg:col-span-5 shadow-subtle border-gray-100 flex flex-col">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle>Open Escalations</CardTitle>
            <CardDescription>Breakdown by severity level</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[300px] pt-4">
            {escalationPieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={escalationPieChartData}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {escalationPieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                    itemStyle={{ color: '#111827', fontWeight: 600 }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <CheckCircle2 className="w-12 h-12 mb-3 text-success/50" />
                <p className="text-sm font-medium">All escalations resolved!</p>
                <p className="text-xs mt-1">There are no open escalations right now.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads Table */}
      <Card className="shadow-subtle border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
          <div>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Latest customer requests across the platform</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-secondary-blue hover:text-blue-700">
            <Link href="/executive/leads">View All Leads</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {recentLeads.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Target className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No recent leads found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                  <TableHead className="font-semibold text-gray-700">Service</TableHead>
                  <TableHead className="font-semibold text-gray-700">Location & Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => {
                  const customerObj = typeof lead.customerId === 'object' ? lead.customerId : null;
                  const serviceObj = typeof lead.serviceId === 'object' ? lead.serviceId : null;
                  const cityObj = typeof lead.cityId === 'object' ? lead.cityId : null;

                  return (
                    <TableRow key={lead._id || lead.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div className="bg-gray-100 rounded-full p-1.5 shrink-0">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="text-gray-900">{customerObj?.fullName || "Customer"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium">
                        {serviceObj?.name || 'Service'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-gray-900 font-medium">{cityObj?.name || 'City'}</span>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1 text-gray-400" />
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-semibold">
                          <Link href={`/executive/leads/${lead._id || lead.id}`}>
                            Manage <ChevronRight className="w-4 h-4 ml-1" />
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
    </div>
  );
}
