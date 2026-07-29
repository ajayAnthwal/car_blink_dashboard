"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  Settings,
  Car,
  IndianRupee,
  Calendar,
  Store,
  Megaphone,
  LifeBuoy,
  UserCheck,
  Bell
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Bookings", href: "/admin/bookings", icon: Calendar },
  { name: "Helpdesk", href: "/admin/helpdesk", icon: LifeBuoy },
  { name: "Partners", href: "/admin/partners", icon: Store },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Staff", href: "/admin/staff", icon: UserCheck },
  { name: "Marketing", href: "/admin/marketing", icon: Megaphone },
  { name: "Website Leads", href: "/admin/marketing/leads", icon: Store },
  { name: "Notifications", href: "/admin/marketing/notifications", icon: Bell },
  { name: "Finance", href: "/admin/finance/settlements", icon: IndianRupee },
  { name: "Master Data", href: "/admin/master-data", icon: Map },
  { name: "Vehicles", href: "/admin/vehicles", icon: Car },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-primary-navy min-h-screen text-neutral-white flex flex-col fixed left-0 top-0 bottom-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-primary-navy-light shrink-0">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-brand-gradient">
          Carblink
        </h1>
        <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-danger text-white rounded-md uppercase">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
          href="/admin/settings"
          className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group ${
            pathname === "/admin/settings"
              ? "bg-primary-orange text-neutral-white font-medium shadow-sm" 
              : "text-neutral-muted hover:bg-primary-navy-light hover:text-neutral-white"
          }`}
        >
          <Settings className={`w-5 h-5 ${pathname === "/admin/settings" ? "text-neutral-white" : "text-neutral-muted group-hover:text-primary-orange"}`} />
          <span>Platform Settings</span>
        </Link>
      </div>
    </aside>
  );
}
