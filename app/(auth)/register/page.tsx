"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/services";
import { ROLES, Role } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [role, setRole] = useState<Role>(ROLES.CUSTOMER);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await registerUser({ ...formData, role });
      
      // Redirect to OTP verification with the identifier (email/phone) pre-filled via query params
      const identifier = formData.email || formData.phone;
      router.push(`/verify-otp?identifier=${encodeURIComponent(identifier)}`);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Join Carblink today to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg border border-danger/20">
                {error}
              </div>
            )}
            
            <Input
              label="Full Name"
              name="fullName"
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="e.g. +919876543210"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-dark">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole(ROLES.CUSTOMER)}
                  className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    role === ROLES.CUSTOMER 
                      ? "bg-primary-navy/5 border-primary-navy text-primary-navy" 
                      : "border-neutral-muted/30 text-neutral-muted hover:border-neutral-muted"
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole(ROLES.PARTNER)}
                  className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    role === ROLES.PARTNER 
                      ? "bg-primary-navy/5 border-primary-navy text-primary-navy" 
                      : "border-neutral-muted/30 text-neutral-muted hover:border-neutral-muted"
                  }`}
                >
                  Partner
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Sign Up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <span className="text-neutral-muted">Already have an account?</span>
          <Link href="/login" className="ml-1 font-medium text-primary-orange hover:text-primary-orange-dark">
            Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
