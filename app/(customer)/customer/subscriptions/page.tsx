"use client";

import React, { useState, useEffect } from "react";
import { checkSubscriptionValidity, purchaseSubscription } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { BadgeCheck, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function SubscriptionsPage() {
  const [activeSub, setActiveSub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const plans = [
    {
      id: "basic",
      name: "Basic AMC",
      price: 2999,
      durationMonths: 12,
      features: ["2 Free Servicings", "10% off on spares", "24/7 Email Support"],
      recommended: false
    },
    {
      id: "premium",
      name: "Premium AMC",
      price: 5999,
      durationMonths: 12,
      features: ["4 Free Servicings", "20% off on spares", "Free RSA Request (1x)", "Priority Support"],
      recommended: true
    }
  ];

  useEffect(() => {
    fetchActiveSubscription();
  }, []);

  const fetchActiveSubscription = async () => {
    try {
      const res = await checkSubscriptionValidity();
      setActiveSub(res?.data || null);
    } catch (err) {
      console.error("Failed to load subscription status", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (plan: any) => {
    setIsPurchasing(plan.id);
    setMessage({ type: "", text: "" });

    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.durationMonths);

      await purchaseSubscription({
        planName: plan.name,
        price: plan.price,
        endDate: endDate.toISOString()
      });

      setMessage({ type: "success", text: `Successfully purchased ${plan.name}!` });
      fetchActiveSubscription();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to purchase subscription." });
    } finally {
      setIsPurchasing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">AMC Subscriptions</h2>
        <p className="text-gray-500 mt-2">Manage your Annual Maintenance Contracts for worry-free driving.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm border font-medium ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {activeSub ? (
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center space-x-3 text-2xl text-white">
                  <BadgeCheck className="w-8 h-8 text-blue-200" />
                  <span className="font-heading tracking-tight">Active Subscription</span>
                </CardTitle>
                <CardDescription className="text-blue-100 mt-2">
                  You are currently protected under an active plan.
                </CardDescription>
              </div>
              <span className="bg-green-400/20 text-green-100 border border-green-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Active
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-2xl font-bold font-heading">{activeSub.planName}</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-200 text-sm">Valid Until</p>
                  <p className="font-medium text-lg">{new Date(activeSub.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Status</p>
                  <p className="font-medium text-lg">{activeSub.status}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center space-x-4">
            <ShieldCheck className="w-10 h-10 text-blue-600 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-blue-900">No Active AMC</h3>
              <p className="text-blue-700 text-sm">Choose a plan below to get free servicings, discounts, and priority support.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.recommended ? 'border-2 border-blue-500 shadow-blue-100' : 'border-gray-200'}`}>
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center pt-8 pb-4">
                  <CardTitle className="text-2xl font-heading text-gray-900">{plan.name}</CardTitle>
                  <div className="mt-4 flex justify-center items-baseline">
                    <span className="text-4xl font-extrabold tracking-tight text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500 ml-1 font-medium">/ year</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-4 mt-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mr-3" />
                        <span className="text-gray-600 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6 pb-8 px-6">
                  <Button 
                    className={`w-full h-12 text-lg rounded-xl shadow-lg transition-transform active:scale-95 ${plan.recommended ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                    onClick={() => handlePurchase(plan)}
                    isLoading={isPurchasing === plan.id}
                    disabled={isPurchasing !== null}
                  >
                    Purchase {plan.name}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
