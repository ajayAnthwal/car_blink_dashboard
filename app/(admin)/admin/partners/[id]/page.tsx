// @ts-nocheck
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import PartnerVerificationReviewScreen from "@/components/partner/PartnerVerificationReviewScreen";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function AdminPartnerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const rawId = params?.id;
  const partnerId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  if (!partnerId) return null;

  const currentRole = user?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <PartnerVerificationReviewScreen 
        partnerId={partnerId} 
        userRole={currentRole} 
        onBack={() => router.push("/admin/partners")} 
      />
    </div>
  );
}

