import React from "react";
import { ProfileForm } from "@/features/users/components/ProfileForm";
import { ChangePasswordForm } from "@/features/users/components/ChangePasswordForm";
import { DeactivateAccount } from "@/features/users/components/DeactivateAccount";

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-primary-navy mb-6">Profile Settings</h2>
      
      <ProfileForm />
      <ChangePasswordForm />
      <DeactivateAccount />
      
    </div>
  );
}
