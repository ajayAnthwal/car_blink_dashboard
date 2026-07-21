"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Target, 
  PhoneCall, 
  Clock, 
  AlertTriangle, 
  Users,
  Briefcase,
  UserCircle
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/executive/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/executive/leads", icon: Target },
  { name: "Follow-ups", href: "/executive/follow-ups", icon: PhoneCall },
  { name: "Pending Follow-ups", href: "/executive/follow-ups/pending", icon: Clock },
  { name: "Escalations", href: "/executive/escalations", icon: AlertTriangle },
  { name: "Customer Status", href: "/executive/customer-status", icon: Users },
  { name: "Partner Status", href: "/executive/partner-status", icon: Briefcase },
];

export function ExecutiveSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-primary-navy min-h-screen text-neutral-white flex flex-col fixed left-0 top-0 bottom-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-primary-navy-light shrink-0">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-brand-gradient">
          Executive Portal
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/executive/dashboard" && item.href !== "/executive/follow-ups");
          
          // Special handling for nested paths to avoid false active states
          const isExactActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group ${
                isExactActive 
                  ? "bg-primary-orange text-neutral-white font-medium shadow-sm" 
                  : "text-neutral-muted hover:bg-primary-navy-light hover:text-neutral-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isExactActive ? "text-neutral-white" : "text-neutral-muted group-hover:text-primary-orange"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-navy-light shrink-0">
        <Link
          href="/executive/profile"
          className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group ${
            pathname === "/executive/profile"
              ? "bg-primary-orange text-neutral-white font-medium shadow-sm" 
              : "text-neutral-muted hover:bg-primary-navy-light hover:text-neutral-white"
          }`}
        >
          <UserCircle className={`w-5 h-5 ${pathname === "/executive/profile" ? "text-neutral-white" : "text-neutral-muted group-hover:text-primary-orange"}`} />
          <span>My Profile</span>
        </Link>
      </div>
    </aside>
  );
}
