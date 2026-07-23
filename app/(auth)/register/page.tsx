"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/services";
import { ROLES, Role } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/layout/AuthLayout";
import { ArrowRight, UserPlus, User, Wrench } from "lucide-react";

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
      
      const identifier = formData.email || formData.phone;
      router.push(`/verify-otp?identifier=${encodeURIComponent(identifier)}`);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-orange/10 text-primary-orange mb-6 shadow-inner">
          <UserPlus className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight mb-2">Create an Account</h2>
        <p className="text-gray-500 text-sm">Join Carblink today and experience premium auto care</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-danger/10 text-danger text-sm p-4 rounded-xl border border-danger/20 flex items-start space-x-2">
            <div className="mt-0.5 font-bold">!</div>
            <div>{error}</div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
          <Input
            name="fullName"
            placeholder="e.g. John Doe"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <Input
              name="email"
              type="email"
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
            <Input
              name="phone"
              type="tel"
              placeholder="e.g. +919876543210"
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
          Create Account
          {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-gray-500 font-medium">Already have an account?</span>
        <Link href="/login" className="ml-1.5 font-bold text-primary-navy hover:text-primary-navy-light transition-colors">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
