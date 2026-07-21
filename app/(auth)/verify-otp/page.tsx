"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { verifyOtp } from "@/lib/services";
import { ROLE_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

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
      login(user, tokens.accessToken, tokens.refreshToken);
      
      const route = ROLE_ROUTES[user.role] || "/";
      router.push(route);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Verify Your Account</CardTitle>
        <CardDescription>Enter the 6-digit code sent to your email or phone</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg border border-danger/20">
              {error}
            </div>
          )}
          
          <Input
            label="Email or Phone"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            readOnly={!!initialIdentifier}
            className={initialIdentifier ? "bg-neutral-bg text-neutral-muted" : ""}
          />
          
          <Input
            label="Verification Code (OTP)"
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
            className="text-center text-lg tracking-widest"
          />
          
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Verify Code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyOTPPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4">
      <Suspense fallback={<div className="w-full max-w-md h-64 bg-neutral-white animate-pulse rounded-2xl" />}>
        <VerifyOTPContent />
      </Suspense>
    </div>
  );
}
