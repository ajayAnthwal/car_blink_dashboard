"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { registerDeviceToken } from "@/lib/services";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      {/* Decorative Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-100/50 blur-[100px]" />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-100/40 blur-[120px]" />
      </div>

      {/* Fixed Sidebar */}
      <div className="z-20">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>
      
      {/* Main Content Area (offset by sidebar width) */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 z-10 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Header />
        
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

