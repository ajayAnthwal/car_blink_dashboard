"use client";

import React, { useState, useEffect } from "react";
import { getPartnerStatus } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/Card";
import { Briefcase, Loader2, Phone, Mail, Clock, ShieldCheck, MapPin } from "lucide-react";

export default function PartnerStatusPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      const res = await getPartnerStatus(1, 50);
      setPartners(res?.docs || res || []);
    } catch (err) {
      console.error("Failed to load partner status", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE": return "bg-success/10 text-success border-success/20";
      case "PENDING_KYC": return "bg-warning/10 text-warning border-warning/20";
      case "SUSPENDED": return "bg-danger/10 text-danger border-danger/20";
      default: return "bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-primary-navy flex items-center">
          <Briefcase className="w-6 h-6 mr-2 text-secondary-blue" /> 
          Partner Status Overview
        </h2>
        <p className="text-neutral-muted text-sm mt-1">Track and manage the current status of all registered service partners.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-10 bg-neutral-white rounded-2xl shadow-sm border border-neutral-muted/20">
          <Loader2 className="w-8 h-8 text-secondary-blue animate-spin" />
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <Briefcase className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
          <p className="text-neutral-muted">No partners found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {partners.map((partner) => (
            <Card key={partner._id} className="hover:shadow-md transition-shadow border-l-4 border-l-secondary-blue">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-primary-navy">{partner.businessName || partner.fullName}</h3>
                    {partner.businessName && <p className="text-xs text-neutral-muted">Contact: {partner.fullName}</p>}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(partner.status)}`}>
                    {partner.status?.replace(/_/g, " ") || "UNKNOWN"}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2 text-sm text-neutral-muted">
                    <p className="flex items-center truncate">
                      <Mail className="w-3.5 h-3.5 mr-2 shrink-0" /> {partner.email}
                    </p>
                    <p className="flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-2 shrink-0" /> {partner.phone}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-neutral-muted">
                    <p className="flex items-center truncate">
                      <MapPin className="w-3.5 h-3.5 mr-2 shrink-0" /> {partner.city?.name || "No City"}
                    </p>
                    <p className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-2 shrink-0" /> Joined {new Date(partner.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-muted/10 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className={`w-5 h-5 ${partner.kycVerified ? "text-success" : "text-neutral-muted/30"}`} />
                    <span className="text-xs font-medium text-neutral-dark">
                      KYC {partner.kycVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-muted bg-neutral-bg px-2 py-1 rounded border border-neutral-muted/20">
                    Jobs Completed: <span className="font-bold text-primary-navy">{partner.completedJobs || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
