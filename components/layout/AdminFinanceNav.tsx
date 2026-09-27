"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PieChart, CreditCard, Landmark, RefreshCw } from "lucide-react";

export function AdminFinanceNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "Overview & Earnings", href: "/admin/finance", icon: PieChart },
    { name: "Customer Transactions", href: "/admin/finance/transactions", icon: CreditCard },
    { name: "Partner Payouts & Settlements", href: "/admin/finance/settlements", icon: Landmark },
    { name: "Refund Requests", href: "/admin/finance/refunds", icon: RefreshCw },
  ];

  return (
    <div className="flex items-center space-x-2 border-b border-gray-200 overflow-x-auto pb-3 mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
              isActive
                ? "bg-primary-navy text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? "text-primary-orange" : "text-gray-500"}`} />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
