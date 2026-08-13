// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminPartnerDetails, useUpdateAdminPartnerKycMutation } from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle, XCircle, FileText, User, MapPin } from "lucide-react";


export default function AdminPartnerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { data: partner, isLoading } = useAdminPartnerDetails(id as string);
  const updateKycMutation = useUpdateAdminPartnerKycMutation();
  
  const [rejectReason, setRejectReason] = useState("");

  const handleUpdateKyc = async (status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !rejectReason.trim()) {
      alert("Please provide a reason for rejecting the KYC.");
      return;
    }
    
    const confirmAction = window.confirm(`Are you sure you want to mark this partner as ${status}?`);
    if (!confirmAction) return;

    try {
      await updateKycMutation.mutateAsync({ id: id as string, status, remarks: rejectReason });
      alert(`Partner KYC ${status.toLowerCase()} successfully.`);
    } catch (error: unknown) {
      alert(error?.message || "Failed to update KYC status.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
        <p className="text-gray-500 font-medium">Loading partner details...</p>
      </div>
    );
  }

  if (!partner) return <div className="p-8 text-center text-red-500 font-bold">Partner not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-12 p-4">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Partners
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary-navy">{partner.businessName}</h1>
          <p className="text-gray-500 mt-1 font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {partner.cityId?.name}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
            partner.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
            partner.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            KYC: {partner.verificationStatus}
          </span>
          {partner.rejectionReason && (
            <p className="text-xs text-red-600 font-medium mt-2 max-w-xs text-right">
              Reason: {partner.rejectionReason}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/90 shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <User className="w-5 h-5 text-primary-orange" /> Owner Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Name</p>
                <p className="font-medium text-gray-900">{partner.userId?.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Contact</p>
                <p className="font-medium text-gray-900">{partner.userId?.phone}</p>
                <p className="font-medium text-gray-900">{partner.userId?.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-orange" /> Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Address</p>
                <p className="font-medium text-gray-900">{partner.businessAddress}</p>
              </div>
              {partner.gstNumber && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">GST Number</p>
                  <p className="font-mono font-bold text-gray-900">{partner.gstNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: KYC Documents & Action */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/90 shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-orange" /> Uploaded KYC Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {partner.kycDocuments?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No documents uploaded by partner.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partner.kycDocuments?.map((doc: unknown) => (
                    <div key={doc._id} className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:border-primary-navy transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 mb-1">{doc.documentType.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500 mb-4">Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                      <a 
                        href={doc.documentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary-navy font-semibold text-sm hover:underline"
                      >
                        View Document ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {partner.verificationStatus !== 'APPROVED' && (
            <Card className="bg-white shadow-sm border-gray-200 overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-lg text-primary-navy">KYC Decision</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleUpdateKyc('APPROVED')}
                      disabled={updateKycMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-green-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" /> Approve KYC
                    </button>
                  </div>
                  
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Reason for rejection (required)"
                      className="w-full px-4 py-3 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <button
                      onClick={() => handleUpdateKyc('REJECTED')}
                      disabled={updateKycMutation.isPending}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 rounded-xl border border-red-200 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" /> Reject KYC
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
