"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getAllRefunds, getAllSettlements } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  BadgeIndianRupee, 
  Undo2, 
  FileText,
  ArrowRight,
  Clock
} from "lucide-react";

export default function AccountsDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingRefunds: 0,
    pendingSettlements: 0,
    totalRefundsAmount: 0,
    totalSettlementsAmount: 0
  });
  const [recentRefunds, setRecentRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [refundsRes, settlementsRes] = await Promise.all([
          getAllRefunds(1, 100).catch(() => ({ data: { refunds: [], total: 0 } })),
          getAllSettlements(1, 100).catch(() => ({ data: { settlements: [], total: 0 } }))
        ]);
        
        // Use structure based on standard pagination response or direct array
        const allRefunds = Array.isArray(refundsRes.data) ? refundsRes.data : (refundsRes.data?.refunds || []);
        const allSettlements = Array.isArray(settlementsRes.data) ? settlementsRes.data : (settlementsRes.data?.settlements || []);

        const pendingRefunds = allRefunds.filter((r: any) => r.status === 'PENDING');
        const pendingSettlements = allSettlements.filter((s: any) => s.status === 'PENDING');
        
        const totalRefundsAmount = allRefunds.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
        const totalSettlementsAmount = allSettlements.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

        setStats({
          pendingRefunds: pendingRefunds.length,
          pendingSettlements: pendingSettlements.length,
          totalRefundsAmount,
          totalSettlementsAmount
        });

        // Get top 3 recent refunds
        setRecentRefunds(allRefunds.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch accounts dashboard data:", error);
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
          <h1 className="text-2xl font-bold text-primary-navy">Accounts Dashboard</h1>
          <p className="text-neutral-muted">Welcome back, {user?.fullName || "Accountant"}!</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/accounts/reports">
            <Button className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Generate Report</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Pending Refunds</p>
                <h3 className="text-3xl font-bold text-primary-navy">{stats.pendingRefunds}</h3>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <Undo2 className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <Link href="/accounts/refunds" className="mt-4 flex items-center text-sm text-red-500 hover:underline font-medium">
              Process refunds <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary-navy">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Pending Settlements</p>
                <h3 className="text-3xl font-bold text-primary-navy">{stats.pendingSettlements}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <BadgeIndianRupee className="w-6 h-6 text-primary-navy" />
              </div>
            </div>
            <Link href="/accounts/settlements" className="mt-4 flex items-center text-sm text-primary-navy hover:underline font-medium">
              View settlements <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Total Refunds</p>
                <h3 className="text-2xl font-bold text-primary-navy">₹{stats.totalRefundsAmount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Total Settlements</p>
                <h3 className="text-2xl font-bold text-primary-navy">₹{stats.totalSettlementsAmount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-primary-navy mb-4">Recent Refunds</h2>
        <Card>
          <CardContent className="p-0">
            {recentRefunds.length === 0 ? (
              <div className="p-8 text-center text-neutral-muted flex flex-col items-center">
                <Undo2 className="w-12 h-12 mb-3 text-neutral-muted/50" />
                <p>No recent refunds found.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-muted/20">
                {recentRefunds.map((refund, idx) => (
                  <div key={idx} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-neutral-bg transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary-navy/5 p-3 rounded-lg">
                        <Clock className="w-5 h-5 text-primary-navy" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-navy">Refund Request #{refund._id?.slice(-6).toUpperCase() || 'REF'}</h4>
                        <p className="text-sm text-neutral-muted flex items-center mt-1">
                          Amount: ₹{refund.amount} • {new Date(refund.createdAt || new Date()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 md:mt-0 flex items-center space-x-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        refund.status === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                        refund.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        refund.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        'bg-warning/20 text-warning'
                      }`}>
                        {refund.status || 'PENDING'}
                      </span>
                      <Link href={`/accounts/refunds`}>
                        <Button variant="outline" size="sm">Manage</Button>
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
