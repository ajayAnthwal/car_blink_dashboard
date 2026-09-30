// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPassword } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/layout/AuthLayout";
import { ArrowRight, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleInputChange = (val: string) => {
    setError("");
    const isEmail = val.includes("@");
    if (!isEmail && /^\d+$/.test(val)) {
      if (val.length > 10) {
        val = val.slice(0, 10);
      }
    }
    setIdentifier(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const rawInput = identifier.trim();
    if (!rawInput) {
      setError("Please enter your email or phone number.");
      return;
    }

    const isEmail = rawInput.includes('@');

    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawInput)) {
        setError("Please enter a valid email address (e.g. name@example.com)");
        return;
      }
    } else {
      if (/[^\d]/.test(rawInput)) {
        setError("Mobile number must contain digits only (10 digits required) or enter a valid email address");
        return;
      }
      if (rawInput.length !== 10) {
        setError("Mobile number must be exactly 10 digits (e.g. 9876543210)");
        return;
      }
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(rawInput)) {
        setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9");
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await forgotPassword({ identifier: isEmail ? rawInput : (cleanIdentifier || rawInput) });
      const serverMsg = res?.data?.message || res?.message || "Reset code has been sent.";
      setSuccess(serverMsg);
      
      setTimeout(() => {
        router.push(`/reset-password?identifier=${encodeURIComponent(rawInput)}`);
      }, 1500);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-orange/10 text-primary-orange mb-6 shadow-inner">
          <KeyRound className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight mb-2">Reset Password</h2>
        <p className="text-gray-500 text-sm">Enter your email or phone to receive a reset code</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-danger/10 text-danger text-sm p-4 rounded-xl border border-danger/20 flex items-start space-x-2">
            <div className="mt-0.5 font-bold">!</div>
            <div>{error}</div>
          </div>
        )}
        {success && (
          <div className="bg-success/10 text-success text-sm p-4 rounded-xl border border-success/20 flex items-start space-x-2">
            <div className="mt-0.5 font-bold">✓</div>
            <div>{success}</div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email or Phone</label>
          <Input
            type="text"
            placeholder="e.g. user@example.com"
            value={identifier}
            onChange={(e) => handleInputChange(e.target.value)}
            required
            className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 mt-2 text-base font-bold bg-primary-navy hover:bg-primary-navy-light text-white shadow-lg shadow-primary-navy/20 transition-all group" 
          isLoading={isLoading}
        >
          Send Reset Code
          {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <Link href="/login" className="font-bold text-primary-orange hover:text-primary-orange-dark transition-colors">
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
