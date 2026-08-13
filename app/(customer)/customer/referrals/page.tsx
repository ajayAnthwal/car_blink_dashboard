// @ts-nocheck
"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Gift, Copy, Check, Users, IndianRupee } from "lucide-react";
import { useUserProfile, useApplyReferralMutation, useCustomerStatsQuery } from "@/features/customer/hooks/useCustomerQueries";

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState("");
  
  const { data: myProfile } = useUserProfile();
  const { data: stats } = useCustomerStatsQuery();
  const applyReferralMutation = useApplyReferralMutation();
  
  const [isCopied, setIsCopied] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleCopyCode = () => {
    if (myProfile?.referralCode) {
      navigator.clipboard.writeText(myProfile.referralCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      if (!referralCode) {
        throw new Error("Please enter a referral code");
      }

      await applyReferralMutation.mutateAsync({ referralCodeUsed: referralCode });

      setMessage({ type: "success", text: "Referral code applied successfully! ₹100 added to your wallet." });
      setReferralCode("");
    } catch (err: unknown) {
      setMessage({ type: "error", text: (err as Error)?.message || "Failed to apply referral code." });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Refer & Earn</h2>
        <p className="text-gray-500 mt-2">Invite friends to CarBlink and earn rewards for every successful booking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Share Code Section */}
        <div className="md:col-span-7">
          <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-purple-100 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-2xl text-purple-900">
                <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                  <Gift className="w-6 h-6" />
                </div>
                <span className="font-heading tracking-tight">Share Your Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Share your unique referral code with friends. When they sign up and complete their first service, both of you will receive <strong className="text-purple-700">₹100</strong> in your CarBlink wallet!
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left w-full">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Your Referral Code</p>
                  <p className="text-3xl font-black text-gray-900 tracking-widest font-mono">
                    {myProfile?.referralCode || "LOADING..."}
                  </p>
                </div>
                <Button 
                  onClick={handleCopyCode} 
                  className={`shrink-0 h-12 px-6 rounded-xl transition-all duration-300 ${isCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  {isCopied ? (
                    <><Check className="w-5 h-5 mr-2" /> Copied!</>
                  ) : (
                    <><Copy className="w-5 h-5 mr-2" /> Copy Code</>
                  )}
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="mx-auto w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{myProfile?.referralsCount || 0}</p>
                  <p className="text-xs text-gray-500 font-medium">Friends Joined</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="mx-auto w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">₹{stats?.rewardPoints || myProfile?.rewardPoints || 0}</p>
                  <p className="text-xs text-gray-500 font-medium">Earned</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="mx-auto w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                    <Gift className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{myProfile?.pendingRewards || 0}</p>
                  <p className="text-xs text-gray-500 font-medium">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Apply Code Section */}
        <div className="md:col-span-5">
          <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-gray-100 h-full">
            <CardHeader>
              <CardTitle className="text-xl font-heading tracking-tight text-gray-900">Have a Referral Code?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-6">
                If a friend invited you, enter their code below to claim your sign-up bonus!
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {message.text && (
                  <div className={`p-3 rounded-lg text-sm border font-medium ${
                    message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-2">
                  <Input 
                    placeholder="e.g. JOHN123"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="h-14 text-lg font-mono tracking-widest text-center uppercase"
                    required
                  />
                </div>
                
                <Button type="submit" isLoading={applyReferralMutation.isPending} className="w-full md:w-auto h-12 px-8 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg">
                    Apply Code
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
