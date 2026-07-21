"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getAdminFinanceSummary, getAdminUsers, getAdminRevenue } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  IndianRupee, 
  Users, 
  TrendingUp,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    activePartners: 0,
    activeCustomers: 0,
    growthRate: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [financeRes, usersRes, revenueRes] = await Promise.all([
          getAdminFinanceSummary().catch(() => ({ data: { totalRevenue: 0, growthRate: 0 } })),
          getAdminUsers(1, 10).catch(() => ({ data: { users: [], total: 0 } })),
          getAdminRevenue("month").catch(() => ({ data: [] }))
        ]);
        
        const finance = financeRes.data || {};
        const usersList = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.users || []);
        
        const allUsers = usersList;
        const activePartners = allUsers.filter((u: any) => u.role === 'PARTNER' && u.isActive).length;
        const activeCustomers = allUsers.filter((u: any) => u.role === 'CUSTOMER' && u.isActive).length;

        setStats({
          totalRevenue: finance.totalRevenue || 0,
          growthRate: finance.growthRate || 0,
          totalUsers: usersRes.data?.total || allUsers.length,
          activePartners,
          activeCustomers
        });

        // Get top 3 recent users
        setRecentUsers(allUsers.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch admin dashboard data:", error);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-danger"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Super Admin Dashboard</h1>
          <p className="text-neutral-muted">Welcome back, {user?.fullName || "Administrator"}!</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/master-data">
            <Button className="flex items-center space-x-2 bg-danger hover:bg-danger/90">
              <ShieldAlert className="w-4 h-4" />
              <span>Manage Master Data</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-primary-navy">₹{stats.totalRevenue}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Total Users</p>
                <h3 className="text-3xl font-bold text-primary-navy">{stats.totalUsers}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <Link href="/admin/users" className="mt-4 flex items-center text-sm text-blue-500 hover:underline font-medium">
              Manage users <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary-orange">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Active Partners</p>
                <h3 className="text-3xl font-bold text-primary-navy">{stats.activePartners}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Monthly Growth</p>
                <h3 className="text-3xl font-bold text-primary-navy">{stats.growthRate}%</h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users Section */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-primary-navy mb-4">Recent Users</h2>
        <Card>
          <CardContent className="p-0">
            {recentUsers.length === 0 ? (
              <div className="p-8 text-center text-neutral-muted flex flex-col items-center">
                <Users className="w-12 h-12 mb-3 text-neutral-muted/50" />
                <p>No recent users found.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-muted/20">
                {recentUsers.map((u, idx) => (
                  <div key={idx} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-neutral-bg transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary-navy/5 p-3 rounded-lg">
                        <Users className="w-5 h-5 text-primary-navy" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-navy">{u.fullName}</h4>
                        <p className="text-sm text-neutral-muted flex items-center mt-1">
                          {u.email} • {u.phone}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 md:mt-0 flex items-center space-x-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        u.role === 'PARTNER' ? 'bg-primary-orange/20 text-primary-orange-dark' :
                        u.role === 'CUSTOMER' ? 'bg-primary-navy/20 text-primary-navy' :
                        'bg-neutral-muted/20 text-neutral-dark'
                      }`}>
                        {u.role}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        u.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
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
