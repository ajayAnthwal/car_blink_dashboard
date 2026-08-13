// @ts-nocheck
"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { verifyOtp } from "@/lib/services";
import { ROLE_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/layout/AuthLayout";
import { ArrowRight, ShieldCheck } from "lucide-react";

function VerifyOTPContent() {
  const searchParams = useSearchParams();
  const initialIdentifier = searchParams.get("identifier") || "";
  
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await verifyOtp({ identifier, otp });
      
      const { user, tokens } = data;
      await login(user, tokens.accessToken, tokens.refreshToken);
      
      const route = ROLE_ROUTES[user.role] || "/";
      router.push(route);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-orange/10 text-primary-orange mb-6 shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight mb-2">Verify Your Account</h2>
        <p className="text-gray-500 text-sm">Enter the 6-digit code sent to your email or phone</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-danger/10 text-danger text-sm p-4 rounded-xl border border-danger/20 flex items-start space-x-2">
            <div className="mt-0.5 font-bold">!</div>
            <div>{error}</div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email or Phone</label>
          <Input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            readOnly={!!initialIdentifier}
            className={`h-12 border-gray-200 transition-colors ${initialIdentifier ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50 focus:bg-white"}`}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Verification Code (OTP)</label>
          <Input
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
            className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors text-center tracking-[0.3em] font-bold text-lg"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 mt-2 text-base font-bold bg-primary-navy hover:bg-primary-navy-light text-white shadow-lg shadow-primary-navy/20 transition-all group" 
          isLoading={isLoading}
        >
          Verify Code
          {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="w-full max-w-md h-72 bg-gray-100 animate-pulse rounded-2xl" />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
