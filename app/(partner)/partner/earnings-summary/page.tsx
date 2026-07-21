"use client";

import React, { useState, useEffect } from "react";
import { getEarningsSummary } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/Card";
import { PieChart, Loader2, IndianRupee, CheckCircle2, TrendingUp } from "lucide-react";

export default function EarningsSummaryPage() {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const res = await getEarningsSummary();
      const data = res?.docs || res || { totalEarnings: 0, completedJobs: 0 };
      setSummary(data);
    } catch (err) {
      console.error("Failed to load earnings summary", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">Lifetime Earnings Summary</h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-10 bg-neutral-white rounded-2xl shadow-sm border border-neutral-muted/20">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-t-4 border-t-primary-orange shadow-md">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <IndianRupee className="w-8 h-8 text-primary-orange" />
              </div>
              <p className="text-neutral-muted font-medium mb-2">Total Lifetime Earnings</p>
              <h3 className="text-4xl font-extrabold text-primary-navy flex items-center justify-center">
                <span className="text-2xl mr-1 font-medium text-neutral-muted">₹</span>
                {summary?.totalEarnings || 0}
              </h3>
              <div className="mt-6 flex items-center text-sm text-success bg-success/10 px-3 py-1 rounded-full font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                Lifetime Data
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-primary-navy shadow-md">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary-navy" />
              </div>
              <p className="text-neutral-muted font-medium mb-2">Total Completed Jobs</p>
              <h3 className="text-4xl font-extrabold text-primary-navy">
                {summary?.completedJobs || 0}
              </h3>
              <div className="mt-6 flex items-center text-sm text-neutral-muted bg-neutral-bg px-3 py-1 rounded-full font-medium">
                <PieChart className="w-4 h-4 mr-1" />
                All Time Jobs
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
