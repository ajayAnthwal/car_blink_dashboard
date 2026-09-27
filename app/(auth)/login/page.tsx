// @ts-nocheck
"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { loginUser, getCurrentUserProfile, sendSignupOtp, verifyOtp } from "@/lib/services";
import { setApiAccessToken } from "@/lib/axios";
import { ROLE_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/layout/AuthLayout";
import GoogleButton from "@/components/ui/GoogleButton";
import { LogIn, Eye, EyeOff, ArrowRight, Phone, Lock, RefreshCw } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ssoToken = searchParams.get('token');

  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(!!ssoToken);

  // OTP Login States
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const { login, user } = useAuth();

  useEffect(() => {
    let timer: any;
    if (loginMode === "otp" && otpStep === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [loginMode, otpStep, resendTimer]);

  useEffect(() => {
    const isLogoutOrSwitch = searchParams.get('logout') === 'true' || searchParams.get('switch') === 'true';
    if (isLogoutOrSwitch && typeof window !== 'undefined') {
      const cookieDomain = window.location.hostname.endsWith("carblink.in") ? "; domain=.carblink.in" : "";
      window.localStorage.removeItem("car_blink_access_token");
      window.localStorage.removeItem("car_blink_refresh_token");
      document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${cookieDomain}`;
      document.cookie = `car_blink_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${cookieDomain}`;
      document.cookie = `role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${cookieDomain}`;
      document.cookie = `user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${cookieDomain}`;
    }
  }, [searchParams]);

  useEffect(() => {
    const isLogoutOrSwitch = searchParams.get('logout') === 'true' || searchParams.get('switch') === 'true';
    if (user && !ssoToken && !isLogoutOrSwitch) {
      const targetRoute = ROLE_ROUTES[user.role] || "/customer/dashboard";
      if (typeof window !== "undefined") {
        window.location.href = targetRoute;
      } else {
        router.push(targetRoute);
      }
    }
  }, [user, ssoToken, router, searchParams]);

  useEffect(() => {
    let tokenFromUrl = ssoToken || 
                       searchParams.get("accessToken") || 
                       searchParams.get("access_token") || 
                       searchParams.get("authToken") || 
                       searchParams.get("jwt") || 
                       searchParams.get("sso") || 
                       searchParams.get("t");
    if (!tokenFromUrl && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      tokenFromUrl = urlParams.get('token') || 
                     urlParams.get('accessToken') || 
                     urlParams.get('access_token') || 
                     urlParams.get('authToken') || 
                     urlParams.get('jwt') || 
                     urlParams.get('sso') || 
                     urlParams.get('t');
    }

    if (tokenFromUrl && tokenFromUrl !== "undefined" && tokenFromUrl !== "null") {
      const cleanToken = tokenFromUrl.trim();
      setIsLoading(true);
      setApiAccessToken(cleanToken);

      const expires = new Date(Date.now() + 30 * 864e5).toUTCString();
      const cookieDomain = typeof window !== "undefined" && window.location.hostname.endsWith("carblink.in") ? "; domain=.carblink.in" : "";

      if (typeof window !== "undefined") {
        window.localStorage.setItem("car_blink_access_token", cleanToken);
        window.localStorage.setItem("carBlink_token", cleanToken);
        document.cookie = `car_blink_access_token=${encodeURIComponent(cleanToken)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
        document.cookie = `accessToken=${encodeURIComponent(cleanToken)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
      }

      getCurrentUserProfile()
        .then(async (res) => {
          const resolvedUser = res?.role ? res : (res?.data?.role ? res.data : (res?.data || res?.user || res));
          if (!resolvedUser || !resolvedUser.role) {
            throw new Error("Invalid user profile response");
          }
          if (typeof window !== "undefined") {
            document.cookie = `role=${encodeURIComponent(resolvedUser.role)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
            document.cookie = `user_role=${encodeURIComponent(resolvedUser.role)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
          }
          await login(resolvedUser, cleanToken, cleanToken);
          const route = ROLE_ROUTES[resolvedUser.role] || "/customer/dashboard";
          if (typeof window !== "undefined") {
            window.location.href = route;
          } else {
            router.push(route);
          }
        })
        .catch((err) => {
          console.error("SSO Login Error:", err);
          setIsLoading(false);
        });
    } else {
      const isLogoutOrSwitch = searchParams.get('logout') === 'true' || searchParams.get('switch') === 'true';
      if (user && user.role && !isLogoutOrSwitch) {
        const targetRoute = ROLE_ROUTES[user.role] || "/customer/dashboard";
        if (typeof window !== "undefined") {
          window.location.href = targetRoute;
        } else {
          router.push(targetRoute);
        }
      }
    }
  }, [ssoToken, user, login, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (typeof window !== "undefined") {
        document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      const data = await loginUser({ identifier, password });

      const { user, tokens } = data;
      const expires = new Date(Date.now() + 30 * 864e5).toUTCString();
      const cookieDomain = typeof window !== "undefined" && window.location.hostname.endsWith("carblink.in") ? "; domain=.carblink.in" : "";

      if (typeof window !== "undefined") {
        window.localStorage.setItem("car_blink_access_token", tokens.accessToken);
        window.localStorage.setItem("carBlink_token", tokens.accessToken);
        document.cookie = `car_blink_access_token=${encodeURIComponent(tokens.accessToken)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
        document.cookie = `accessToken=${encodeURIComponent(tokens.accessToken)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
        document.cookie = `role=${encodeURIComponent(user.role)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
        document.cookie = `user_role=${encodeURIComponent(user.role)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
      }
      await login(user, tokens.accessToken, tokens.refreshToken);

      const targetRoute = ROLE_ROUTES[user.role] || "/customer/dashboard";
      if (typeof window !== "undefined") {
        window.location.href = targetRoute;
      } else {
        router.push(targetRoute);
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanPhone = otpPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsLoading(true);
    try {
      await sendSignupOtp({ phone: cleanPhone });
      setOtpStep(2);
      setResendTimer(30);
      setCanResend(false);
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP to mobile number");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 6) {
      setError("Please enter 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const cleanPhone = otpPhone.replace(/[^0-9]/g, '');
      const res = await verifyOtp({ identifier: cleanPhone, otp: cleanOtp });
      const { user, tokens } = res?.data || res;
      if (!user || !tokens?.accessToken) {
        throw new Error("Invalid verification response");
      }
      const expires = new Date(Date.now() + 30 * 864e5).toUTCString();
      const cookieDomain = typeof window !== "undefined" && window.location.hostname.endsWith("carblink.in") ? "; domain=.carblink.in" : "";

      if (typeof window !== "undefined") {
        window.localStorage.setItem("car_blink_access_token", tokens.accessToken);
        window.localStorage.setItem("carBlink_token", tokens.accessToken);
        document.cookie = `car_blink_access_token=${encodeURIComponent(tokens.accessToken)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
        document.cookie = `accessToken=${encodeURIComponent(tokens.accessToken)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
        document.cookie = `role=${encodeURIComponent(user.role)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
        document.cookie = `user_role=${encodeURIComponent(user.role)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
      }
      await login(user, tokens.accessToken, tokens.refreshToken);
      const targetRoute = ROLE_ROUTES[user.role] || "/customer/dashboard";
      if (typeof window !== "undefined") {
        window.location.href = targetRoute;
      } else {
        router.push(targetRoute);
      }
    } catch (err: any) {
      setError(err?.message || "Invalid OTP code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (!canResend || isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      const cleanPhone = otpPhone.replace(/[^0-9]/g, '');
      await sendSignupOtp({ phone: cleanPhone });
      setResendTimer(30);
      setCanResend(false);
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  if (ssoToken && !error) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-orange"></div>
          <h3 className="text-lg font-bold text-gray-900 font-heading">Logging you in...</h3>
          <p className="text-gray-500 text-sm font-medium">Authenticating & redirecting to your dashboard...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-orange/10 text-primary-orange mb-6 shadow-inner">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight mb-2">Welcome Back</h2>
        <p className="text-gray-500 text-sm">Access your CarBlink account</p>
      </div>

      <div className="mb-6">
        <GoogleButton text="Continue with Google" />
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <span className="relative bg-white px-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            or sign in with
          </span>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => { setLoginMode("password"); setError(""); }}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMode === "password" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
        >
          Password Sign In
        </button>
        <button
          type="button"
          onClick={() => { setLoginMode("otp"); setError(""); setOtpStep(1); }}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMode === "otp" ? "bg-white text-primary-orange shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
        >
          Mobile OTP Sign In
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 text-danger text-sm p-4 rounded-xl border border-danger/20 mb-6 flex flex-col space-y-2">
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 font-bold">!</div>
            <div>{error}</div>
          </div>
          {loginMode === "password" && (error.toLowerCase().includes("without a password") || error.toLowerCase().includes("incorrect")) && (
            <div className="pt-2 border-t border-danger/20 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMode("otp");
                  if (identifier && /^[6-9]\d{9}$/.test(identifier.replace(/[^0-9]/g, ''))) {
                    setOtpPhone(identifier.replace(/[^0-9]/g, ''));
                  }
                  setError("");
                }}
                className="text-xs font-bold bg-primary-orange text-white px-3 py-1.5 rounded-lg hover:bg-primary-orange-dark transition-colors"
              >
                Sign In with Mobile OTP
              </button>
              <Link
                href={`/forgot-password${identifier ? `?identifier=${encodeURIComponent(identifier)}` : ''}`}
                className="text-xs font-bold text-gray-700 underline py-1.5"
              >
                Set / Reset Password
              </Link>
            </div>
          )}
        </div>
      )}

      {loginMode === "password" ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email or Phone</label>
            <Input
              type="text"
              placeholder="e.g. user@example.com or +919876543210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <Link
                href={`/forgot-password${identifier ? `?identifier=${encodeURIComponent(identifier)}` : ''}`}
                className="text-sm font-bold text-primary-orange hover:text-primary-orange-dark transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-bold bg-primary-navy hover:bg-primary-navy-light text-white shadow-lg shadow-primary-navy/20 transition-all group" 
            isLoading={isLoading}
          >
            Sign In
            {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </form>
      ) : (
        <div>
          {otpStep === 1 ? (
            <form onSubmit={handleSendOtpSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">+91</span>
                  <Input
                    type="tel"
                    placeholder="98765 43210"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    required
                    maxLength={10}
                    className="h-12 pl-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-primary-orange hover:bg-orange-600 text-white shadow-lg shadow-primary-orange/20 transition-all group"
                isLoading={isLoading}
              >
                Send OTP
                {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center justify-between text-xs text-gray-700 mb-2">
                <span>OTP sent to <strong>+91 {otpPhone}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpStep(1)}
                  className="font-bold text-primary-orange hover:underline"
                >
                  Change Number
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Enter 6-Digit OTP</label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="h-12 text-center text-xl font-bold tracking-widest bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  <span>Didn't receive OTP?</span>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendLoginOtp}
                      disabled={isLoading}
                      className="font-bold text-primary-orange hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span className="font-semibold text-gray-400">Resend in {resendTimer}s</span>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-primary-orange hover:bg-orange-600 text-white shadow-lg shadow-primary-orange/20 transition-all group"
                isLoading={isLoading}
                disabled={otpCode.length < 6 || isLoading}
              >
                Verify & Sign In
                {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          )}
        </div>
      )}

      <div className="mt-8 text-center text-sm">
        <span className="text-gray-500 font-medium">Don&apos;t have an account?</span>
        <Link href="/register" className="ml-1.5 font-bold text-primary-orange hover:text-primary-orange-dark transition-colors">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
}export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
