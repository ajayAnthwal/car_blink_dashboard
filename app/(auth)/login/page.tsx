// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { loginUser, getCurrentUserProfile } from "@/lib/services";
import { setApiAccessToken } from "@/lib/axios";
import { ROLE_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/layout/AuthLayout";
import { ArrowRight, LogIn, Eye, EyeOff } from "lucide-react";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ssoToken = searchParams.get('token');

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(!!ssoToken);

  const { login, user } = useAuth();

  useEffect(() => {
    if (user && !ssoToken) {
      const targetRoute = ROLE_ROUTES[user.role] || "/customer/dashboard";
      if (typeof window !== "undefined") {
        window.location.href = targetRoute;
      } else {
        router.push(targetRoute);
      }
    }
  }, [user, ssoToken, router]);

  useEffect(() => {
    let tokenToUse = ssoToken;
    if (!tokenToUse && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      tokenToUse = urlParams.get('token');
    }

    if (tokenToUse) {
      setIsLoading(true);
      setApiAccessToken(tokenToUse);
      if (typeof window !== "undefined") {
        const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
        window.localStorage.setItem("car_blink_access_token", tokenToUse);
        document.cookie = `car_blink_access_token=${encodeURIComponent(tokenToUse)}; path=/; expires=${expires}`;
        document.cookie = `accessToken=${encodeURIComponent(tokenToUse)}; path=/; expires=${expires}`;
      }
      
      getCurrentUserProfile()
        .then(async (res) => {
          const resolvedUser = res?.role ? res : (res?.data?.role ? res.data : (res?.data || res?.user || res));
          if (!resolvedUser || !resolvedUser.role) {
            console.error("SSO User resolution failed. Received payload:", JSON.stringify(res));
            throw new Error("Invalid user profile response");
          }
          await login(resolvedUser, tokenToUse, tokenToUse);
          const route = ROLE_ROUTES[resolvedUser.role] || "/customer/dashboard";
          if (typeof window !== "undefined") {
            window.location.href = route;
          } else {
            router.push(route);
          }
        })
        .catch((err) => {
          console.error("SSO Login Error:", err);
          setApiAccessToken(null);
          setIsLoading(false);
          setError("Session expired or invalid. Please login again.");
        });
    }
  }, [ssoToken, login, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await loginUser({ identifier, password });

      const { user, tokens } = data;
      await login(user, tokens.accessToken, tokens.refreshToken);

      // Redirect strictly based on newly authenticated user.role
      const targetRoute = ROLE_ROUTES[user.role] || "/";
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
        <p className="text-gray-500 text-sm">Enter your credentials to access your account</p>
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
              href="/forgot-password"
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

      <div className="mt-8 text-center text-sm">
        <span className="text-gray-500 font-medium">Don&apos;t have an account?</span>
        <Link href="/register" className="ml-1.5 font-bold text-primary-orange hover:text-primary-orange-dark transition-colors">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
