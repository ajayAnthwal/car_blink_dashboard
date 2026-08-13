// @ts-nocheck
"use client";

import React from "react";
import { ProfileForm } from "@/features/users/components/ProfileForm";
import { ChangePasswordForm } from "@/features/users/components/ChangePasswordForm";
import { DeactivateAccount } from "@/features/users/components/DeactivateAccount";
import { useUserProfile } from "@/features/customer/hooks/useCustomerQueries";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: myProfile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 space-y-6 md:space-y-8 pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight mb-8">Account Settings</h2>
      
      <ProfileForm />
      <ChangePasswordForm />
      <DeactivateAccount />
      
    </div>
  );
}
