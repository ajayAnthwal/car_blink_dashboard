"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExecutiveLeadById, initiateClickToCall } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Car, 
  Wrench, 
  MapPin, 
  Calendar, 
  Clock,
  Briefcase,
  Target
} from "lucide-react";
import Link from "next/link";

export default function LeadDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [callMessage, setCallMessage] = useState({ type: "", text: "" });
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getExecutiveLeadById(id);
      
      const leadData = response?.data || response?.lead || response;
      if (!leadData || Object.keys(leadData).length === 0) {
        throw new Error("Lead not found");
      }
      setLead(leadData);
    } catch (err: any) {
      console.error("Failed to load lead details", err);
      setError(err?.message || "Failed to load lead details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallCustomer = async (phoneNumber: string) => {
    if (!phoneNumber) return;
    setIsCalling(true);
    setCallMessage({ type: "", text: "" });
    try {
      await initiateClickToCall({ phoneNumber });
      setCallMessage({ type: "success", text: `Calling ${phoneNumber}... Check your phone.` });
      setTimeout(() => setCallMessage({ type: "", text: "" }), 5000);
    } catch (err: any) {
      setCallMessage({ type: "error", text: err?.message || "Failed to initiate call." });
      setTimeout(() => setCallMessage({ type: "", text: "" }), 5000);
    } finally {
      setIsCalling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 col-span-1 md:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 bg-white rounded-2xl shadow-subtle border border-gray-100">
        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
        <p className="text-gray-500 mb-6">{error || "The requested lead could not be found."}</p>
        <Button onClick={() => router.push("/executive/leads")} className="bg-primary-navy">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leads
        </Button>
      </div>
    );
  }

  const customerObj = typeof lead.customerId === 'object' ? lead.customerId : null;
  const serviceObj = typeof lead.serviceId === 'object' ? lead.serviceId : null;
  const vehicleObj = typeof lead.vehicleId === 'object' ? lead.vehicleId : null;
  const cityObj = typeof lead.cityId === 'object' ? lead.cityId : null;
  const assignedPartners = lead.assignment?.assignedPartnerIds || [];
  const bids = lead.bids || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500 relative">
      
      {callMessage.text && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-elevated border flex items-center space-x-3 animate-in slide-in-from-right-8 ${
          callMessage.type === "success" 
            ? "bg-white text-success border-success/20" 
            : "bg-white text-danger border-danger/20"
        }`}>
          <div className={`p-2 rounded-full ${callMessage.type === "success" ? "bg-success/10" : "bg-danger/10"}`}>
            <Phone className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm">{callMessage.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/executive/leads")} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">
              Lead Details
            </h1>
            <p className="text-sm text-gray-500 font-medium font-body flex items-center mt-1">
              ID: {lead._id || lead.id} <span className="mx-2">•</span> 
              <Clock className="w-3 h-3 mr-1" /> {new Date(lead.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div>
          <StatusBadge status={lead.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Customer Information */}
        <Card className="shadow-subtle border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-lg flex items-center">
              <div className="bg-blue-50 p-2 rounded-lg mr-3">
                <User className="w-5 h-5 text-secondary-blue" />
              </div>
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Full Name</span>
              <span className="text-gray-900 font-medium">{customerObj?.fullName || "N/A"}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Phone Number</span>
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">{customerObj?.phone || "N/A"}</span>
                {customerObj?.phone && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCallCustomer(customerObj.phone)}
                    disabled={isCalling}
                    className="h-7 text-xs border-primary-orange text-primary-orange hover:bg-orange-50"
                  >
                    <Phone className="w-3 h-3 mr-1" /> Call
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Email</span>
              <span className="text-gray-900 font-medium flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                {customerObj?.email || "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card className="shadow-subtle border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-lg flex items-center">
              <div className="bg-indigo-50 p-2 rounded-lg mr-3">
                <Car className="w-5 h-5 text-indigo-500" />
              </div>
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Brand</span>
              <span className="text-gray-900 font-medium">{vehicleObj?.brand || "N/A"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Model</span>
              <span className="text-gray-900 font-medium">{vehicleObj?.model || "N/A"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Year</span>
              <span className="text-gray-900 font-medium">{vehicleObj?.year || "N/A"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Fuel Type</span>
              <span className="text-gray-900 font-medium">{vehicleObj?.fuelType || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Service Request Information */}
        <Card className="shadow-subtle border-gray-100 md:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-lg flex items-center">
              <div className="bg-orange-50 p-2 rounded-lg mr-3">
                <Wrench className="w-5 h-5 text-primary-orange" />
              </div>
              Service Request Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Service Type</span>
                <span className="text-gray-900 font-medium">{serviceObj?.name || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">City</span>
                <span className="text-gray-900 font-medium flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" /> {cityObj?.name || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Preferred Date</span>
                <span className="text-gray-900 font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" /> 
                  {lead.preferredDate ? new Date(lead.preferredDate).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Customer Description</span>
              <span className="text-gray-700 italic">"{lead.description || "No description provided."}"</span>
            </div>
          </CardContent>
        </Card>

        {/* Assignments & Bids */}
        <Card className="shadow-subtle border-gray-100 md:col-span-2">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-lg flex items-center">
              <div className="bg-green-50 p-2 rounded-lg mr-3">
                <Briefcase className="w-5 h-5 text-success" />
              </div>
              Partner Assignments & Bids
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Assigned Partners */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                Currently Assigned Partners
              </h3>
              {assignedPartners.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-100">
                  No partners are currently assigned to this lead.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignedPartners.map((partner: any) => (
                    <div key={partner._id || Math.random()} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{partner.businessName || "Partner"}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{partner.businessAddress || "No address"}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-success" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                Received Bids / Quotes
              </h3>
              {bids.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-100">
                  No bids have been received for this lead yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {bids.map((bid: any) => (
                    <div key={bid._id} className="p-4 border border-gray-200 rounded-lg bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-bold text-primary-navy">₹{bid.quotedAmount}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            bid.status === 'ACCEPTED' ? 'bg-success/10 text-success' : 
                            bid.status === 'REJECTED' ? 'bg-danger/10 text-danger' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {bid.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">By: {typeof bid.partnerId === 'object' ? bid.partnerId?.businessName : "Partner"}</p>
                        {bid.notes && <p className="text-xs text-gray-600 mt-1 italic">"{bid.notes}"</p>}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-semibold text-gray-700">Est. Duration</p>
                        <p className="text-sm font-medium text-gray-900">{bid.estimatedDuration || "N/A"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
