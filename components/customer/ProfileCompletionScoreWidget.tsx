// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useGarageVehicles } from "@/features/customer/hooks/useCustomerQueries";
import { 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Mail, 
  Phone, 
  Image as ImageIcon, 
  MapPin, 
  Car, 
  PhoneCall, 
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileCompletionScoreWidget() {
  const { user } = useAuth();
  const u = (user || {}) as any;

  const { data: garageData } = useGarageVehicles();
  const garageVehicles = Array.isArray(garageData) ? garageData : (garageData?.vehicles || garageData?.docs || []);

  const [isExpanded, setIsExpanded] = useState(true);

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

  // Progress bar color based on score
  let progressColor = "bg-amber-500";
  if (percentage >= 80) {
    progressColor = "bg-emerald-500";
  } else if (percentage >= 50) {
    progressColor = "bg-indigo-500";
  }

  return (
    <div className="w-full mb-6">
      <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 shadow-md ${
        is100Percent 
          ? "bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-emerald-700/50 text-white" 
          : "bg-gradient-to-r from-slate-900 via-primary-navy to-slate-950 border-white/10 text-white"
      }`}>
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-orange/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Left Column: Score Meter & Info */}
            <div className="flex items-center gap-3.5 sm:gap-5 min-w-0 flex-1">
              <div className="relative shrink-0 flex items-center justify-center">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-heading font-black shadow-lg border ${
                  is100Percent 
                    ? "bg-emerald-500 text-white border-emerald-400" 
                    : "bg-white/10 text-white border-white/20 backdrop-blur-md"
                }`}>
                  <span className="text-lg sm:text-xl leading-none font-extrabold">{completedCount}/{totalCount}</span>
                  <span className="text-[10px] uppercase font-bold text-white/70 tracking-wider mt-0.5">{percentage}%</span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-white flex items-center gap-2">
                    Profile Completion: {completedCount}/{totalCount}
                    {is100Percent && <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    is100Percent ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/30" : "bg-white/10 text-white/90 border-white/20"
                  }`}>
                    {is100Percent ? "100% Verified 🎉" : `${totalCount - completedCount} Pending`}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1 max-w-xl">
                  {is100Percent 
                    ? "Awesome! Your profile is 100% complete. Enjoy instant quote approvals and priority service booking."
                    : `Complete your details to reach 10/10 score. Missing ${totalCount - completedCount} details required for faster service quotes.`}
                </p>

                {/* Progress Bar */}
                <div className="mt-3 max-w-md w-full bg-white/10 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: CTA Button & Toggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
              {!is100Percent && (
                <Button asChild size="sm" className="bg-primary-orange hover:bg-primary-orange-dark text-white font-bold rounded-xl text-xs px-4 py-2 shadow-md flex-1 sm:flex-initial">
                  <Link href={missingItems[0]?.href || "/customer/profile"} className="flex items-center gap-1.5">
                    <span>Complete Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              )}

              {!is100Percent && missingItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-xs flex items-center gap-1 font-semibold"
                  title={isExpanded ? "Hide pending fields" : "Show pending fields"}
                >
                  <span className="hidden sm:inline">{isExpanded ? "Hide" : "View"}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Missing Fields Breakdown Chips */}
          {!is100Percent && isExpanded && missingItems.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Missing Fields ({missingItems.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {missingItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="group flex items-center gap-2 bg-white/10 hover:bg-primary-orange/20 border border-white/15 hover:border-primary-orange/50 rounded-xl px-3 py-1.5 transition-all text-xs font-semibold text-white shadow-xs"
                    >
                      <ItemIcon className="w-3.5 h-3.5 text-primary-orange group-hover:scale-110 transition-transform" />
                      <span>{item.actionLabel}</span>
                      <span className="text-[10px] text-white/50 group-hover:text-white transition-colors">+</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileCompletionScoreWidget;
