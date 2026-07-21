"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Car, 
  CalendarCheck, 
  ShieldCheck, 
  CreditCard, 
  HelpCircle,
  Star,
  Settings
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { name: "My Garage", href: "/customer/garage", icon: Car },
  { name: "My Bookings", href: "/customer/bookings", icon: CalendarCheck },
  { name: "Warranties", href: "/customer/warranty", icon: ShieldCheck },
  { name: "Support Tickets", href: "/customer/support", icon: HelpCircle },
  { name: "Payments", href: "/customer/payments", icon: CreditCard },
  { name: "My Reviews", href: "/customer/reviews", icon: Star },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-primary-navy min-h-screen text-neutral-white flex flex-col fixed left-0 top-0 bottom-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-primary-navy-light shrink-0">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-brand-gradient">
          Carblink
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
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
          href="/customer/profile"
          className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group ${
            pathname === "/customer/profile"
              ? "bg-primary-orange text-neutral-white font-medium shadow-sm" 
              : "text-neutral-muted hover:bg-primary-navy-light hover:text-neutral-white"
          }`}
        >
          <Settings className={`w-5 h-5 ${pathname === "/customer/profile" ? "text-neutral-white" : "text-neutral-muted group-hover:text-primary-orange"}`} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
