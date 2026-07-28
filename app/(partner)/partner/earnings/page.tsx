"use client";

import React, { useState, useEffect } from "react";
import { getPartnerEarnings, getPartnerSettlements } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndianRupee, Loader2, Calendar, Filter, FileText, ArrowRightCircle } from "lucide-react";
import { useSocket } from "@/lib/SocketContext";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalEarnings: 0, cashCollected: 0, onlineEarnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");
  const [activeTab, setActiveTab] = useState<"transactions" | "settlements">("transactions");
  const { socket } = useSocket();

  useEffect(() => {
    fetchEarnings();
    fetchSettlements();
  }, [period]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchEarnings();
      fetchSettlements();
    };
    socket.on("settlement_updated", handleUpdate);
    return () => {
      socket.off("settlement_updated", handleUpdate);
    };
  }, [socket, period]);

  const fetchSettlements = async () => {
    try {
      setIsLoadingSettlements(true);
      const res = await getPartnerSettlements();
      setSettlements(Array.isArray(res) ? res : (res?.data || res?.docs || []));
    } catch (err) {
      console.error("Failed to load settlements", err);
    } finally {
      setIsLoadingSettlements(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      setIsLoading(true);
      const res = await getPartnerEarnings(period);
      const dataArray = res?.docs || res?.transactions || [];
      setEarnings(res?.transactions || []);
      setSummary({ 
        totalEarnings: res?.totalEarnings || 0, 
        cashCollected: res?.cashCollected || 0, 
        onlineEarnings: res?.onlineEarnings || 0 
      });
    } catch (err) {
      console.error("Failed to load earnings", err);
    } finally {
      setIsLoading(false);
    }
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
            {isLoading ? "..." : summary.totalEarnings}
          </h3>
        </div>
        <div className="bg-neutral-white/10 p-4 rounded-full">
          <IndianRupee className="w-10 h-10 text-neutral-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border shadow-sm">
          <p className="text-sm text-neutral-muted">Online Earnings</p>
          <h4 className="text-xl font-bold text-success-dark">₹{summary.onlineEarnings}</h4>
        </div>
        <div className="bg-white p-4 rounded-2xl border shadow-sm">
          <p className="text-sm text-neutral-muted">Cash Collected</p>
          <h4 className="text-xl font-bold text-primary-orange">₹{summary.cashCollected}</h4>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex space-x-4 border-b border-neutral-muted/20 mb-6">
          <button
            className={`pb-2 px-1 text-sm font-semibold transition-colors ${
              activeTab === "transactions" ? "text-primary-navy border-b-2 border-primary-navy" : "text-neutral-muted hover:text-neutral-dark"
            }`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
          <button
            className={`pb-2 px-1 text-sm font-semibold transition-colors flex items-center ${
              activeTab === "settlements" ? "text-primary-navy border-b-2 border-primary-navy" : "text-neutral-muted hover:text-neutral-dark"
            }`}
            onClick={() => setActiveTab("settlements")}
          >
            Commission & Settlements
            {settlements.filter(s => s.status === 'PENDING').length > 0 && (
              <span className="ml-2 bg-primary-orange text-white text-[10px] px-2 py-0.5 rounded-full">
                {settlements.filter(s => s.status === 'PENDING').length} New
              </span>
            )}
          </button>
        </div>

        {activeTab === "transactions" && (
          <div>
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
        )}

        {activeTab === "settlements" && (
          <div>
            {isLoadingSettlements ? (
              <div className="flex items-center justify-center p-10 bg-neutral-white rounded-2xl shadow-sm border border-neutral-muted/20">
                <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
              </div>
            ) : settlements.length === 0 ? (
              <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
                <FileText className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
                <p className="text-neutral-muted">No commission requests or settlements found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {settlements.map((settlement, idx) => (
                  <Card key={idx} className={`hover:shadow-md transition-shadow border-l-4 ${settlement.status === 'PENDING' ? 'border-l-warning' : 'border-l-success'}`}>
                    <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="font-bold text-primary-navy text-lg">
                            Commission Request for Job #{settlement.jobId?._id?.slice(-6).toUpperCase() || settlement.jobId?.slice(-6).toUpperCase()}
                          </h4>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            settlement.status === 'PENDING' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                          }`}>
                            {settlement.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3 text-sm">
                          <div>
                            <span className="text-neutral-muted">Gross Amount:</span> <span className="font-semibold">₹{settlement.grossAmount}</span>
                          </div>
                          <div>
                            <span className="text-neutral-muted">Platform Fee:</span> <span className="font-semibold text-danger">₹{settlement.platformCommission}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-neutral-muted">Generated On:</span> <span className="font-semibold">{new Date(settlement.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-neutral-bg p-4 rounded-xl flex flex-col items-end min-w-[200px] w-full md:w-auto">
                        <p className="text-xs text-neutral-muted mb-1">Net Payable to Platform</p>
                        <p className="text-2xl font-extrabold text-primary-navy mb-3">₹{Math.abs(settlement.netPayoutAmount || settlement.platformCommission)}</p>
                        
                        {settlement.status === 'PENDING' ? (
                          <Button size="sm" className="w-full bg-primary-orange hover:bg-primary-orange-light text-white" onClick={() => alert("Payment gateway integration pending.")}>
                            Pay Now <ArrowRightCircle className="w-4 h-4 ml-2" />
                          </Button>
                        ) : (
                          <div className="text-xs text-success font-medium bg-success/10 px-3 py-1.5 rounded-lg w-full text-center">
                            Paid via Ref: {settlement.transactionReference || 'Online'}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
