// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, forgotPassword } from "@/lib/services";
import { ROLES, Role, ROLE_ROUTES } from "@/lib/constants";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/layout/AuthLayout";
import GoogleButton from "@/components/ui/GoogleButton";
import { ArrowRight, UserPlus, User, Wrench, ShieldCheck, Lock, RotateCcw, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [role, setRole] = useState<Role>(ROLES.CUSTOMER);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let timer: any;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const clean = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: clean.slice(0, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError("");
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = formData.phone.trim();
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)");
      return;
    }

    if (!formData.fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword({ identifier: cleanPhone });
      setStep(2);
      setResendTimer(30);
      setCanResend(false);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to send OTP to mobile number. Please check your number.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      await forgotPassword({ identifier: formData.phone });
      setResendTimer(30);
      setCanResend(false);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP code received on your mobile");
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = formData.email && formData.email.trim() ? formData.email.trim() : undefined;
      const res = await registerUser({
        fullName: formData.fullName.trim(),
        email: cleanEmail,
        phone: formData.phone.trim(),
        password: formData.password,
        role: role,
        otp: cleanOtp
      });

      const userObj = res?.data?.user || res?.user || res?.data || res;
      const tokensObj = res?.data?.tokens || res?.tokens;

      if (tokensObj?.accessToken && userObj?.role) {
        await login(userObj, tokensObj.accessToken, tokensObj.refreshToken || tokensObj.accessToken);
        const targetRoute = ROLE_ROUTES[userObj.role] || "/customer/dashboard";
        window.location.href = targetRoute;
      } else {
        router.push(`/login`);
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Incorrect OTP or registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-orange/10 text-primary-orange mb-6 shadow-inner">
          {step === 1 ? <UserPlus className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight mb-2">
          {step === 1 ? "Create an Account" : "Verify Mobile Number"}
        </h2>
        <p className="text-gray-500 text-sm">
          {step === 1 
            ? "Join Carblink today and experience premium auto care" 
            : `Enter the 6-digit OTP sent to +91 ${formData.phone}`}
        </p>
      </div>

      {error && (
        <div className="mb-5 bg-danger/10 text-danger text-sm p-4 rounded-xl border border-danger/20 flex items-start space-x-2">
          <div className="mt-0.5 font-bold">!</div>
          <div>{error}</div>
        </div>
      )}

      {step === 1 ? (
        /* ================= STEP 1: SIGNUP DETAILS ================= */
        <div className="space-y-5">
          <div className="mb-4">
            <GoogleButton text="Sign up with Google" role={role} />
            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                or sign up with form
              </span>
            </div>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <Input
              name="fullName"
              placeholder="e.g. Rahul Kumar"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address (Optional)</label>
              <Input
                name="email"
                type="email"
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={handleChange}
                className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <Input
                name="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                maxLength={10}
                value={formData.phone}
                onChange={handleChange}
                required
                className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
          
          <div className="pt-2 pb-1">
            <label className="block text-sm font-semibold text-gray-700 mb-3">I am joining as a</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole(ROLES.CUSTOMER)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  role === ROLES.CUSTOMER 
                    ? "border-primary-orange bg-orange-50/50 shadow-sm" 
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className={`p-2 rounded-full mb-2 ${role === ROLES.CUSTOMER ? 'bg-primary-orange text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <User className="w-5 h-5" />
                </div>
                <span className={`font-bold text-sm ${role === ROLES.CUSTOMER ? 'text-gray-900' : 'text-gray-500'}`}>Customer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole(ROLES.PARTNER)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  role === ROLES.PARTNER 
                    ? "border-primary-navy bg-primary-navy/5 shadow-sm" 
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className={`p-2 rounded-full mb-2 ${role === ROLES.PARTNER ? 'bg-primary-navy text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <Wrench className="w-5 h-5" />
                </div>
                <span className={`font-bold text-sm ${role === ROLES.PARTNER ? 'text-gray-900' : 'text-gray-500'}`}>Partner (Garage)</span>
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 mt-4 text-base font-bold bg-primary-orange hover:bg-primary-orange-dark text-white shadow-lg shadow-primary-orange/20 transition-all group" 
            isLoading={isLoading}
          >
            Continue & Send OTP
            {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </form>
        </div>
      ) : (
        /* ================= STEP 2: OTP VERIFICATION ================= */
        <form onSubmit={handleVerifyAndRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Enter 6-Digit SMS OTP</label>
            <Input
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              required
              className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors text-center tracking-[0.3em] font-bold text-lg"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>Didn't receive code?</span>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="font-semibold text-primary-orange hover:underline inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Resend OTP
              </button>
            ) : (
              <span className="font-medium text-gray-400">Resend in {resendTimer}s</span>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 mt-2 text-base font-bold bg-primary-orange hover:bg-primary-orange-dark text-white shadow-lg shadow-primary-orange/20 transition-all group" 
            isLoading={isLoading}
            disabled={otp.length < 6 || isLoading}
          >
            Verify & Create Account
            {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
          </Button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors pt-2"
          >
            ← Change Details / Edit Mobile Number
          </button>
        </form>
      )}

      <div className="mt-8 text-center text-sm">
        <span className="text-gray-500 font-medium">Already have an account?</span>
        <Link href="/login" className="ml-1.5 font-bold text-primary-navy hover:text-primary-navy-light transition-colors">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
