"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { registerDeviceToken } from "@/lib/services";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Mock FCM Token Registration on app load if authenticated
    const setupPushNotifications = async () => {
      if (isAuthenticated) {
        try {
          // In a real app, you would initialize Firebase Messaging here and get the token
          const mockFcmToken = "fcm_token_" + Math.random().toString(36).substring(7);
          
          await registerDeviceToken({ deviceToken: mockFcmToken });
          console.log("Device token registered successfully");
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
      <Sidebar />
      
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
