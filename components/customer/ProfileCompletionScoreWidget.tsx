// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useGarageVehicles } from "@/features/customer/hooks/useCustomerQueries";
import { CheckCircle2, AlertCircle, Sparkles, ChevronDown, ChevronUp, User, Mail, Phone, Image as ImageIcon, MapPin, Car, PhoneCall, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileCompletionScoreWidget() {
  const { user } = useAuth();
  const u = (user || {}) as any;

  const { data: garageData } = useGarageVehicles();
  const garageVehicles = Array.isArray(garageData) ? garageData : (garageData?.vehicles || garageData?.docs || []);

  // Default to collapsed for a ultra-compact sleek look
  const [isExpanded, setIsExpanded] = useState(false);

  // 10 REAL Profile & Account Criteria
  const items = [
    {
      id: "name",
      label: "Full Name",
      completed: !!(u.fullName && u.fullName.trim().length > 0),
      actionLabel: "Add Name",
      href: "/customer/profile",
      icon: User
    },
    {
      id: "email",
      label: "Email Address",
      completed: !!(u.email && String(u.email).includes("@")),
      actionLabel: "Add Email",
      href: "/customer/profile",
      icon: Mail
    },
    {
      id: "phone",
      label: "Mobile Number",
      completed: !!(u.phone && String(u.phone).length >= 10),
      actionLabel: "Add Phone",
      href: "/customer/profile",
      icon: Phone
    },
    {
      id: "photo",
      label: "Profile Picture",
      completed: !!(u.profileImage || u.avatar),
      actionLabel: "Upload Photo",
      href: "/customer/profile",
      icon: ImageIcon
    },
    {
      id: "altPhone",
      label: "Alternate Contact",
      completed: !!(u.alternatePhone || u.secondaryPhone || u.emergencyContact),
      actionLabel: "Add Alt Contact",
      href: "/customer/profile",
      icon: PhoneCall
    },
    {
      id: "address",
      label: "Address Line",
      completed: !!(u.address || u.addressLine || u.street),
      actionLabel: "Add Address",
      href: "/customer/profile",
      icon: MapPin
    },
    {
      id: "city",
      label: "City Name",
      completed: !!(u.city),
      actionLabel: "Add City",
      href: "/customer/profile",
      icon: MapPin
    },
    {
      id: "state",
      label: "State Name",
      completed: !!(u.state),
      actionLabel: "Add State",
      href: "/customer/profile",
      icon: MapPin
    },
    {
      id: "pincode",
      label: "Pin Code",
      completed: !!(u.pincode || u.zipCode || u.postalCode),
      actionLabel: "Add Pincode",
      href: "/customer/profile",
      icon: MapPin
    },
    {
      id: "garage",
      label: "Vehicle in Garage",
      completed: garageVehicles.length > 0,
      actionLabel: "Add Vehicle",
      href: "/customer/garage",
      icon: Car
    }
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const missingItems = items.filter((i) => !i.completed);
  const is100Percent = completedCount === totalCount;

  let progressColor = "bg-amber-500";
  if (percentage >= 80) {
    progressColor = "bg-emerald-500";
  } else if (percentage >= 50) {
    progressColor = "bg-secondary-blue";
  }

  return (
    <div className="w-full mb-4">
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm ${
        is100Percent 
          ? "bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-emerald-700/40 text-white" 
          : "bg-gradient-to-r from-slate-900 via-primary-navy/95 to-slate-950 border-white/10 text-white"
      }`}>
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary-orange/10 blur-2xl" />

        <div className="relative z-10 p-3 sm:p-3.5 px-4 sm:px-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            
            {/* Left: Score Badge & Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`shrink-0 px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold text-xs border shadow-xs ${
                is100Percent 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" 
                  : "bg-white/10 text-white border-white/15"
              }`}>
                <span className="font-extrabold text-sm">{completedCount}/{totalCount}</span>
                <span className="text-[10px] text-white/70 font-mono">({percentage}%)</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-semibold text-xs sm:text-sm text-white truncate">
                    Profile Completion
                    {is100Percent && <Sparkles className="w-3.5 h-3.5 text-emerald-400 inline ml-1.5" />}
                  </h4>
                  <span className="text-[10px] font-medium text-white/60 hidden md:inline">
                    {is100Percent ? "All set!" : `${totalCount - completedCount} fields missing`}
                  </span>
                </div>
                
                {/* Micro Progress Bar */}
                <div className="mt-1 w-full max-w-xs bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {!is100Percent && (
                <Button asChild size="sm" className="bg-primary-orange hover:bg-primary-orange/90 text-white font-bold rounded-xl text-xs px-3 py-1.5 h-8 shadow-xs">
                  <Link href={missingItems[0]?.href || "/customer/profile"} className="flex items-center gap-1">
                    <span>Complete</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </Button>
              )}

              {!is100Percent && missingItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium h-8 px-2 border border-white/10"
                >
                  <span className="text-[11px]">{isExpanded ? "Hide" : `+${missingItems.length} Missing`}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Micro Chips for Missing Fields */}
          {!is100Percent && isExpanded && missingItems.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
              {missingItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex items-center gap-1.5 bg-white/10 hover:bg-primary-orange/20 border border-white/10 hover:border-primary-orange/40 rounded-lg px-2 py-0.5 transition-all text-[11px] font-medium text-white/90"
                  >
                    <ItemIcon className="w-3 h-3 text-primary-orange" />
                    <span>{item.actionLabel}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileCompletionScoreWidget;
