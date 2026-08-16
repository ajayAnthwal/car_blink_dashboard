// @ts-nocheck
"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AccountsSidebar } from "@/components/layout/AccountsSidebar";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";

import { ROLE_ROUTES } from "@/lib/constants";

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== "ACCOUNTS") {
        const correctRoute = ROLE_ROUTES[user.role] || "/login";
        router.replace(correctRoute);
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  if (!user || user.role !== "ACCOUNTS") {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Fixed Sidebar */}
      <AccountsSidebar />
      
      {/* Main Content Area (offset by sidebar width) */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
