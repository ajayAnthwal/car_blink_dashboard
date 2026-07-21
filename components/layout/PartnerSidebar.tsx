"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  Target, 
  MessageSquareQuote, 
  Wrench,
  ShieldCheck,
  IndianRupee,
  PieChart,
  Settings
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
  { name: "My Profile", href: "/partner/profile", icon: User },
  { name: "KYC", href: "/partner/kyc", icon: FileText },
  { name: "Leads", href: "/partner/leads", icon: Target },
  { name: "My Bids", href: "/partner/bids", icon: MessageSquareQuote },
  { name: "My Jobs", href: "/partner/jobs", icon: Wrench },
  { name: "Warranty", href: "/partner/warranty", icon: ShieldCheck },
  { name: "Earnings", href: "/partner/earnings", icon: IndianRupee },
  { name: "Earnings Summary", href: "/partner/earnings-summary", icon: PieChart },
];

export function PartnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-primary-navy min-h-screen text-neutral-white flex flex-col fixed left-0 top-0 bottom-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-primary-navy-light shrink-0">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-brand-gradient">
          Carblink Partner
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/partner/dashboard");
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group ${
                isActive 
                  ? "bg-primary-orange text-neutral-white font-medium shadow-sm" 
                  : "text-neutral-muted hover:bg-primary-navy-light hover:text-neutral-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-neutral-white" : "text-neutral-muted group-hover:text-primary-orange"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-navy-light shrink-0">
        <Link
          href="/partner/profile"
          className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group ${
            pathname === "/partner/profile"
              ? "bg-primary-orange text-neutral-white font-medium shadow-sm" 
              : "text-neutral-muted hover:bg-primary-navy-light hover:text-neutral-white"
          }`}
        >
          <Settings className={`w-5 h-5 ${pathname === "/partner/profile" ? "text-neutral-white" : "text-neutral-muted group-hover:text-primary-orange"}`} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
