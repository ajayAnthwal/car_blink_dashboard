"use client";

import React, { useState, useEffect } from "react";
import { getPartnerEarnings } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, Loader2, Calendar, Filter } from "lucide-react";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    try {
      setIsLoading(true);
      const res = await getPartnerEarnings(period);
      setEarnings(res?.docs || res || []);
    } catch (err) {
      console.error("Failed to load earnings", err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return earnings.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-navy">Earnings Report</h2>
          <p className="text-neutral-muted text-sm mt-1">View your recent earnings from completed jobs.</p>
        </div>
        
        <div className="flex bg-neutral-white border border-neutral-muted/20 rounded-lg p-1 shadow-sm">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                period === p 
                  ? "bg-primary-navy text-neutral-white shadow" 
                  : "text-neutral-muted hover:text-primary-navy hover:bg-neutral-bg"
              }`}
            >
              {p === "today" ? "Today" : `This ${p}`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-navy to-primary-navy-light rounded-2xl p-6 text-neutral-white shadow-lg flex items-center justify-between">
        <div>
          <p className="text-neutral-white/70 font-medium mb-1 flex items-center">
            <Filter className="w-4 h-4 mr-2" /> 
            Total for selected period
          </p>
          <h3 className="text-4xl font-bold flex items-center">
            <IndianRupee className="w-8 h-8 mr-1" />
            {isLoading ? "..." : calculateTotal()}
          </h3>
        </div>
        <div className="bg-neutral-white/10 p-4 rounded-full">
          <IndianRupee className="w-10 h-10 text-neutral-white" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-primary-navy mb-4">Transactions</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-10 bg-neutral-white rounded-2xl shadow-sm border border-neutral-muted/20">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
          </div>
        ) : earnings.length === 0 ? (
          <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
            <IndianRupee className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
            <p className="text-neutral-muted">No earnings found for the selected period.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {earnings.map((earning, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <IndianRupee className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary-navy">
                        Payment for Job #{earning.jobId?.slice(-6).toUpperCase() || 'JOB'}
                      </h4>
                      <p className="text-xs text-neutral-muted flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(earning.createdAt || Date.now()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">+₹{earning.amount}</p>
                    <p className="text-xs text-neutral-muted">{earning.paymentType || "Settlement"}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
