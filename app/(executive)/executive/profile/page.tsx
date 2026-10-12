// @ts-nocheck
import React from "react";
import { ProfileForm } from "@/features/users/components/ProfileForm";
import { ChangePasswordForm } from "@/features/users/components/ChangePasswordForm";
import { DeactivateAccount } from "@/features/users/components/DeactivateAccount";

export default function ProfilePage() {
  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto space-y-8 pb-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-heading tracking-tight mb-8">Account Settings</h2>
      
      <ProfileForm />
      <ChangePasswordForm />
      <DeactivateAccount />
      
    </div>
  );
}
