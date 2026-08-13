// @ts-nocheck
import React from "react";
import { ProfileForm } from "@/features/users/components/ProfileForm";
import { ChangePasswordForm } from "@/features/users/components/ChangePasswordForm";
import { DeactivateAccount } from "@/features/users/components/DeactivateAccount";

export default function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight mb-8">Account Settings</h2>
      
      <ProfileForm />
      <ChangePasswordForm />
      <DeactivateAccount />
      
    </div>
  );
}
