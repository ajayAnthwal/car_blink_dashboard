"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      router.push("/");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Fixed Sidebar */}
      <AdminSidebar />
      
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
