"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPassword } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
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
      await forgotPassword({ identifier });
      
      setSuccess("If an account exists, a reset code has been sent.");
      
      // Navigate to reset password after brief delay
      setTimeout(() => {
        router.push(`/reset-password?identifier=${encodeURIComponent(identifier)}`);
      }, 2000);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your email or phone to receive a reset code</CardDescription>
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
              placeholder="e.g. user@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send Reset Code
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <Link href="/login" className="font-medium text-primary-orange hover:text-primary-orange-dark">
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
