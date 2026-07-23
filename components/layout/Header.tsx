"use client";

import React from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogOut, User as UserIcon, Bell, Menu, Gift, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { roleConfig } from "@/lib/roleConfig";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";

// Mock notifications for the bell dropdown
const mockNotifications = [
  { id: 1, title: "New Lead", message: "You have a new lead for Honda City.", time: "5m ago", read: false },
  { id: 2, title: "Payout Processed", message: "Your payout of ₹12,500 has been processed.", time: "2h ago", read: false },
  { id: 3, title: "Review Received", message: "Rahul Verma left a 5-star review.", time: "1d ago", read: true },
];

export function Header() {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  
  const currentRole = user?.role || "CUSTOMER";
  const config = roleConfig[currentRole];

  const getGreeting = () => {
    return user?.fullName || "User";
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-subtle transition-all duration-200">
      <div className="flex items-center space-x-4">
        {/* Mobile Sidebar Trigger */}
        <Sheet>
          <SheetTrigger className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none rounded-lg hover:bg-gray-50">
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-primary-navy border-none text-white">
             {/* Render Sidebar content inside the sheet for mobile */}
             <div className="h-full flex flex-col">
               <div className="h-20 flex items-center px-4 shrink-0 border-b border-white/5 space-x-2">
                 <div className={`${config.accentBgColor} rounded p-1.5 text-white flex items-center justify-center shrink-0`}>
                   <span className="font-bold text-lg leading-none">CB</span>
                 </div>
                 <span className="text-white font-bold text-xl tracking-wide">CarBlink</span>
               </div>
               <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
                 {config.navSections.map((section, idx) => (
                   <div key={idx} className="space-y-1">
                     {section.label && (
                       <p className="px-3 text-[10px] text-neutral-400 font-bold tracking-widest uppercase mb-2">
                         {section.label}
                       </p>
                     )}
                     
                     {section.items.map((item) => {
                       const isExactActive = pathname === item.href;
                       const isDashboard = item.href.endsWith("/dashboard");
                       const isActive = isExactActive || (!isDashboard && pathname.startsWith(item.href));
                       const Icon = item.icon;

                       return (
                         <SheetClose render={
                         <Link
                           href={item.href}
                           className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                             isActive
                               ? `${config.accentBgColor}/10 ${config.themeColor} font-medium`
                               : "text-neutral-400 hover:bg-white/5 hover:text-white"
                           }`}
                         >
                           {isActive && (
                             <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 ${config.accentBgColor} rounded-r-full`} />
                           )}
                           <Icon
                             className={`w-5 h-5 shrink-0 mr-3 transition-colors duration-200 ${
                               isActive ? config.themeColor : "text-neutral-400 group-hover:text-white"
                             }`}
                           />
                           <span className="text-sm flex-1">{item.name}</span>
                           {item.badge && (
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm text-white ${item.badgeColor} shrink-0`}>
                               {item.badge}
                             </span>
                           )}
                         </Link>
                       } key={item.name} />
                       );
                     })}
                   </div>
                 ))}
               </nav>
             </div>
          </SheetContent>
        </Sheet>

        <div className="hidden md:flex flex-col justify-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center font-heading">
              Good Morning, {getGreeting()} <span className="ml-2 text-xl">👋</span>
            </h2>
          </div>
          <div className="flex items-center space-x-2 mt-0.5">
            <p className="text-sm text-gray-500 font-medium font-body">{config.portalTitle}</p>
            <span className="text-gray-300 text-xs">•</span>
            <Badge className={`${config.accentBgColor}/10 ${config.themeColor} text-[10px] px-2 py-0 border-none font-bold tracking-wider uppercase shadow-none hover:bg-transparent`}>
              {config.roleName}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-5">
        {user?.role === "PARTNER" && (
          <button className="hidden md:flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 font-semibold text-sm">
            <Gift className="w-4 h-4" />
            <span>Refer & Earn</span>
          </button>
        )}

        <div className="flex items-center h-8 space-x-3 md:space-x-5 border-l border-gray-100 pl-3 md:pl-5">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative p-2 text-gray-400 hover:text-gray-900 transition-colors duration-200 focus:outline-none rounded-full hover:bg-gray-50">
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 md:top-1.5 md:right-1.5 flex h-3.5 w-3.5 md:h-4 md:w-4 items-center justify-center rounded-full bg-danger text-[9px] md:text-[10px] font-bold text-white border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl shadow-elevated border-gray-100">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 font-heading">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className={`${config.accentBgColor}/10 ${config.themeColor} hover:${config.accentBgColor}/20 border-none`}>
                    {unreadCount} New
                  </Badge>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {mockNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  mockNotifications.map((notif) => (
                    <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${notif.read ? 'opacity-70' : `${config.accentBgColor}/5`}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{notif.title}</h4>
                        <span className="text-[10px] font-medium text-gray-500">{notif.time}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center rounded-b-xl">
                <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center transition-colors duration-200">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark all read
                </button>
                <Link href={`/${currentRole.toLowerCase()}/notifications`} className={`text-xs font-semibold ${config.themeColor} hover:opacity-80 transition-opacity duration-200`}>
                  View all
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <Avatar className="h-9 w-9 md:h-10 md:w-10 border border-gray-200 cursor-pointer hover:ring-2 hover:ring-gray-100 transition-all duration-200 shadow-subtle">
                <AvatarImage src="" alt={getGreeting()} />
                <AvatarFallback className={`${config.accentBgColor} text-white font-bold`}>
                  {getGreeting().charAt(0)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-elevated border-gray-100">
              <div className="p-4 border-b border-gray-50 flex flex-col space-y-1">
                <p className="text-sm font-bold text-gray-900 leading-none">{user?.fullName || "User"}</p>
                <p className="text-xs text-gray-500 font-medium leading-none mt-2">
                  {user?.email || "user@example.com"}
                </p>
              </div>
              <div className="p-2">
                <DropdownMenuItem className="rounded-lg cursor-pointer p-0">
                  <Link href={`/${currentRole.toLowerCase()}/profile`} className="flex items-center w-full px-2 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors duration-200">
                    <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100 my-1" />
                <DropdownMenuItem 
                  onClick={logout} 
                  className="rounded-lg cursor-pointer text-danger focus:bg-red-50 focus:text-danger hover:text-danger w-full px-2 py-2 text-sm transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
