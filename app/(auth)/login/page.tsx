"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { loginUser } from "@/lib/services";
import { ROLE_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await loginUser({ identifier, password });

      const { user, tokens } = data;
      login(user, tokens.accessToken, tokens.refreshToken);

      // Redirect based on role
      const route = ROLE_ROUTES[user.role] || "/";
      router.push(route);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Enter your details to sign in to your account</CardDescription>
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
              placeholder="e.g. user@example.com or +919876543210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-neutral-dark mb-1.5">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary-orange hover:text-primary-orange-dark mb-1.5"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <span className="text-neutral-muted">Don&apos;t have an account?</span>
          <Link href="/register" className="ml-1 font-medium text-primary-orange hover:text-primary-orange-dark">
            Create account
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
