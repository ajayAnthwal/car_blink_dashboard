"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, User as UserIcon, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { roleConfig } from "@/lib/roleConfig";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCustomerBookings } from "@/features/customer/hooks/useCustomerQueries";

export function Sidebar({
  isCollapsed = false,
  toggleCollapse,
}: {
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Default to CUSTOMER config if user/role is not available yet to avoid crashes
  const currentRole = user?.role || "CUSTOMER";
  const config = roleConfig[currentRole];

  const { data: bookingsData } = useCustomerBookings();
  const customerBookings = bookingsData?.bookings || [];

  const activeBooking = React.useMemo(() => {
    if (currentRole !== "CUSTOMER") return null;
    return customerBookings.find((b: any) => ['PENDING', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status));
  }, [customerBookings, currentRole]);

  return (
    <aside
      className={`hidden md:flex flex-col bg-primary-navy min-h-screen text-neutral-white fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 shadow-elevated ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="h-20 flex items-center justify-between px-4 shrink-0 border-b border-white/5">
        <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : "space-x-2"}`}>
          <div className={`${config.accentBgColor} rounded p-1.5 text-white flex items-center justify-center shrink-0`}>
            <span className="font-bold text-lg leading-none">CB</span>
          </div>
          {!isCollapsed && (
            <span className="text-white font-bold text-xl tracking-wide">CarBlink</span>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {config.navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && section.label && (
              <p className="px-3 text-[10px] text-neutral-400 font-bold tracking-widest uppercase mb-2">
                {section.label}
              </p>
            )}
            
            {section.items.map((item) => {
              const isExactActive = pathname === item.href;
              // Specific overrides for overview/dashboard to not highlight everything
              const isDashboard = item.href.endsWith("/dashboard");
              const isActive = isExactActive || (!isDashboard && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? `${config.accentBgColor}/10 ${config.themeColor} font-medium`
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  } ${isCollapsed ? "justify-center" : "justify-start"}`}
                >
                  {isActive && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 ${config.accentBgColor} rounded-r-full`} />
                  )}
                  <div className="flex items-center w-full relative">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                        isActive ? config.themeColor : "text-neutral-400 group-hover:text-white"
                      }`}
                    />
                    {!isCollapsed && <span className="ml-3 text-sm flex-1">{item.name}</span>}
                    {item.badge && !isCollapsed && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm text-white ${item.badgeColor} shrink-0`}>
                        {item.badge}
                      </span>
                    )}
                    {item.badge && isCollapsed && (
                      <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${item.badgeColor}`} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

        {/* Active Booking Card for Customers */}
        {!isCollapsed && currentRole === "CUSTOMER" && activeBooking && (
          <div className="px-1 my-3">
            <Link href={`/customer/bookings/${activeBooking._id}`} className="block group">
              <div className="p-3.5 bg-gradient-to-br from-orange-500/20 via-purple-500/20 to-orange-500/10 border border-orange-500/40 hover:border-orange-500/80 rounded-xl transition-all shadow-md">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-orange-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping mr-1.5 inline-block" />
                    ACTIVE BOOKING
                  </span>
                  <span className="bg-orange-500/20 text-orange-300 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">
                    {activeBooking.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-white font-bold text-xs truncate">
                  {typeof activeBooking.serviceId === 'object' ? activeBooking.serviceId.name : 'Car Service'}
                </p>
                <p className="text-gray-300 text-[11px] truncate mt-0.5">
                  {typeof activeBooking.vehicleId === 'object' ? `${activeBooking.vehicleId.brand} ${activeBooking.vehicleId.model}` : 'Vehicle Details'}
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] font-semibold text-orange-300 group-hover:text-orange-200 flex items-center justify-between">
                  <span>View Details</span>
                  <span>&rarr;</span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </nav>

      <div className="p-3 shrink-0 mt-auto border-t border-white/5 bg-black/10">
        {toggleCollapse && (
          <button
            onClick={toggleCollapse}
            className={`w-full flex items-center p-2 mb-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 ${
              isCollapsed ? "justify-center" : "justify-end"
            }`}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="w-full focus:outline-none">
            <div className={`flex items-center p-2 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer ${isCollapsed ? "justify-center" : "space-x-3 text-left"}`}>
              <Avatar className="h-9 w-9 border border-gray-600 shrink-0 shadow-subtle">
                <AvatarFallback className={`${config.accentBgColor} text-white font-bold text-xs`}>
                  {user?.fullName?.charAt(0) || config.roleName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="overflow-hidden flex-1">
                  <h4 className="font-semibold text-white text-sm truncate">{user?.fullName || "User"}</h4>
                  <div className="mt-0.5">
                    <Badge className={`${config.accentBgColor}/20 ${config.themeColor} text-[9px] px-1.5 py-0 border-none font-bold tracking-wider uppercase`}>
                      {config.roleName}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "start" : "end"} side={isCollapsed ? "right" : "top"} className="w-56 mb-2 rounded-xl shadow-elevated border-gray-100">
            <div className="p-4 border-b border-gray-50 flex flex-col space-y-1">
              <p className="text-sm font-bold text-gray-900 leading-none">{user?.fullName || "User"}</p>
              <p className="text-xs text-gray-500 font-medium leading-none mt-2">
                {config.roleName} Account
              </p>
            </div>
            <div className="p-2">
              <DropdownMenuItem className="rounded-lg cursor-pointer p-0">
                <Link href={`/${currentRole.toLowerCase()}/profile`} className="flex items-center w-full px-2 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100 my-1" />
              <DropdownMenuItem
                onClick={logout}
                className="rounded-lg cursor-pointer text-danger focus:bg-red-50 focus:text-danger hover:text-danger w-full px-2 py-2 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
