// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { registerDeviceToken } from "@/lib/services";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { ROLE_ROUTES } from "@/lib/constants";

export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== "EXECUTIVE") {
        const correctRoute = ROLE_ROUTES[user.role] || "/login";
        router.replace(correctRoute);
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Register FCM Token for notifications
    const setupPushNotifications = async () => {
      if (isAuthenticated) {
        try {
          const mockFcmToken = "fcm_executive_token_" + Math.random().toString(36).substring(7);
          await registerDeviceToken({ deviceToken: mockFcmToken });
          console.log("Executive device token registered");
        } catch (error) {
          console.error("Failed to register device token", error);
        }
      }
    };

    setupPushNotifications();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  if (!user || user.role !== "EXECUTIVE") {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Fixed Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      {/* Main Content Area (offset by sidebar width) */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Header />
        
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

