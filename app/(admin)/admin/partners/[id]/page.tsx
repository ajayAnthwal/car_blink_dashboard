// @ts-nocheck
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import PartnerVerificationReviewScreen from "@/components/partner/PartnerVerificationReviewScreen";

export default function AdminPartnerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  if (!id) return null;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <PartnerVerificationReviewScreen 
        partnerId={id as string} 
        userRole="ADMIN" 
        onBack={() => router.push("/admin/partners")} 
      />
    </div>
  );
}

