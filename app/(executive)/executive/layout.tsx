"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { registerDeviceToken } from "@/lib/services";
import { ExecutiveSidebar } from "@/components/layout/ExecutiveSidebar";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";

export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "EXECUTIVE") {
      router.push("/");
    }
  }, [user, router]);

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

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Fixed Sidebar */}
      <ExecutiveSidebar />
      
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
