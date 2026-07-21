"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const initialIdentifier = searchParams.get("identifier") || "";
  
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await resetPassword({ identifier, token: otp, newPassword });
      
      setSuccess("Password reset successfully. Redirecting to login...");
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to reset password. Please check the code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Create New Password</CardTitle>
        <CardDescription>Enter the code sent to you and your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg border border-danger/20">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-success/10 text-success text-sm p-3 rounded-lg border border-success/20">
              {success}
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
            label="Reset Code (OTP)"
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
            className="text-center tracking-widest"
          />
          
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Reset Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4">
      <Suspense fallback={<div className="w-full max-w-md h-72 bg-neutral-white animate-pulse rounded-2xl" />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
