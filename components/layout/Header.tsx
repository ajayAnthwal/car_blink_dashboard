"use client";

import React, { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogOut, User as UserIcon, Bell } from "lucide-react";
import Link from "next/link";

export function Header() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-neutral-white border-b border-neutral-muted/20 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        {/* Placeholder for breadcrumbs or mobile toggle */}
        <span className="text-lg font-medium text-primary-navy">Customer Portal</span>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-neutral-muted hover:bg-neutral-bg hover:text-primary-orange rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-orange/50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-neutral-white"></span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-1 pl-2 pr-3 bg-neutral-bg hover:bg-neutral-muted/10 rounded-full transition-colors border border-neutral-muted/10 focus:outline-none focus:ring-2 focus:ring-primary-orange/50"
          >
            <div className="w-8 h-8 rounded-full bg-primary-navy/5 border border-primary-navy/10 flex items-center justify-center text-primary-navy font-semibold text-sm overflow-hidden">
              {(user as { profileImage?: string })?.profileImage ? (
                <img src={(user as { profileImage?: string }).profileImage} alt={user?.fullName} className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.charAt(0) || <UserIcon className="w-4 h-4" />
              )}
            </div>
            <span className="text-sm font-medium text-neutral-dark hidden sm:block">
              {user?.fullName?.split(" ")[0] || "User"}
            </span>
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setDropdownOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-neutral-white rounded-xl shadow-lg border border-neutral-muted/20 z-40 overflow-hidden py-1">
                <div className="px-4 py-2 border-b border-neutral-muted/10">
                  <p className="text-sm font-semibold text-neutral-dark truncate">{user?.fullName}</p>
                  <p className="text-xs text-neutral-muted truncate">{user?.email}</p>
                </div>
                
                <Link 
                  href="/customer/profile" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-bg hover:text-primary-orange transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                
                <button 
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-danger hover:bg-danger/5 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
