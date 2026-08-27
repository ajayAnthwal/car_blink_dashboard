// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExecutiveLeadById, useClickToCallMutation } from "@/features/executive/hooks/useExecutiveQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
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
  Target,
  Image as ImageIcon,
  CheckCircle,
  Share,
  ClipboardList,
  ExternalLink
} from "lucide-react";

export default function LeadDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const { data: lead, isLoading, error: queryError } = useExecutiveLeadById(id);
  const clickToCallMutation = useClickToCallMutation();
  
  const [callMessage, setCallMessage] = useState({ type: "", text: "" });
  const [isCalling, setIsCalling] = useState(false);
  const error = queryError ? (queryError as Error).message : null;

  const handleCallCustomer = async (phoneNumber: string) => {
    if (!phoneNumber) return;
    setIsCalling(true);
    setCallMessage({ type: "", text: "" });
    try {
      await clickToCallMutation.mutateAsync({ phoneNumber });
      setCallMessage({ type: "success", text: `Calling ${phoneNumber}... Check your phone.` });
      setTimeout(() => setCallMessage({ type: "", text: "" }), 5000);
    } catch (err: unknown) {
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
  
  const hasCoordinates = lead.location?.coordinates?.length === 2;
  const coordinatesStr = hasCoordinates ? `${lead.location.coordinates[1].toFixed(4)}, ${lead.location.coordinates[0].toFixed(4)}` : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 relative">
      
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
          <Button variant="ghost" size="icon" onClick={() => router.push("/executive/leads")} className="text-gray-500 hover:text-gray-900 bg-white shadow-sm border border-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">
              Lead Details
            </h1>
            <p className="text-sm text-gray-500 font-medium font-body flex items-center mt-1">
              ID: {lead._id || lead.id} <span className="mx-2">•</span> 
              <Clock className="w-3 h-3 mr-1" /> {new Date(lead.createdAt).toLocaleString()}
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
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Reg. Number</span>
              <span className="text-gray-900 font-medium">{vehicleObj?.registrationNumber || "N/A"}</span>
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
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-50 p-2 rounded-lg mr-3">
                  <Wrench className="w-5 h-5 text-primary-orange" />
                </div>
                Service Request Details
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Service Type</span>
                <span className="text-gray-900 font-medium">{serviceObj?.name || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Location</span>
                <span className="text-gray-900 font-medium flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" /> 
                  {cityObj?.name || coordinatesStr || "N/A"}
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
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Description / Notes</span>
              <span className="text-gray-700 italic">&quot;{lead.description || "No description provided."}&quot;</span>
            </div>

            {/* Interactive Live Customer Location Map */}
            {(hasCoordinates || lead.address || cityObj?.name) && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-primary-orange" />
                    Customer Live Geolocation Map
                  </h4>
                  {(hasCoordinates || lead.address || cityObj?.name) && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${hasCoordinates ? `${lead.location.coordinates[1]},${lead.location.coordinates[0]}` : encodeURIComponent(`${lead.address || ''} ${cityObj?.name || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary-orange hover:text-orange-600 flex items-center bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 hover:bg-orange-100 transition-colors"
                    >
                      Open Google Maps Navigation <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>

                <div className="rounded-2xl overflow-hidden border border-gray-200 h-64 bg-slate-100 shadow-inner relative group">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://maps.google.com/maps?q=${hasCoordinates ? `${lead.location.coordinates[1]},${lead.location.coordinates[0]}` : encodeURIComponent(`${lead.address || ''} ${cityObj?.name || ''}`)}&z=15&output=embed`}
                    className="w-full h-full"
                  ></iframe>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <span className="font-mono text-gray-700">
                    <strong>Coordinates:</strong> {coordinatesStr || "Not recorded"}
                  </span>
                  {lead.address && (
                    <span className="truncate max-w-md">
                      <strong>Address:</strong> {lead.address} {lead.landmark ? `(Landmark: ${lead.landmark})` : ''}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Photos Section */}
            {(() => {
              const beforePhotos = lead.beforePhotos?.length ? lead.beforePhotos : (lead.job?.beforePhotos || lead.partnerJob?.beforePhotos || []);
              const afterPhotos = lead.afterPhotos?.length ? lead.afterPhotos : (lead.job?.afterPhotos || lead.partnerJob?.afterPhotos || []);
              
              if (!beforePhotos.length && !afterPhotos.length) return null;

              return (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center mb-3">
                    <ImageIcon className="w-4 h-4 mr-2 text-primary-orange" /> Vehicle Service Photos ({beforePhotos.length + afterPhotos.length})
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {beforePhotos.length > 0 && (
                      <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <span className="text-xs text-gray-600 uppercase font-bold mb-2 block">Before Service Photos ({beforePhotos.length})</span>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {beforePhotos.map((url: string, idx: number) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={idx} src={url} alt={`Before ${idx}`} className="h-20 w-20 object-cover rounded-lg shadow-sm border border-gray-200 hover:scale-105 transition-transform" />
                          ))}
                        </div>
                      </div>
                    )}
                    {afterPhotos.length > 0 && (
                      <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <span className="text-xs text-gray-600 uppercase font-bold mb-2 block">After Service Photos ({afterPhotos.length})</span>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {afterPhotos.map((url: string, idx: number) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={idx} src={url} alt={`After ${idx}`} className="h-20 w-20 object-cover rounded-lg shadow-sm border border-gray-200 hover:scale-105 transition-transform" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Assignments & Bids */}
        <Card className="shadow-subtle border-gray-100 md:col-span-2">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-50 p-2 rounded-lg mr-3">
                  <Briefcase className="w-5 h-5 text-success" />
                </div>
                Partner Assignments & Bids
              </div>
              
              {lead.assignment && (
                 <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 flex items-center text-xs px-2 py-1">
                   <ClipboardList className="w-3 h-3 mr-1" />
                   {lead.assignment.assignmentType?.replace(/_/g, " ") || "ASSIGNED"}
                 </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Assigned Partners */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center">
                  Assigned Partners ({assignedPartners.length})
                </h3>
              </div>
              {assignedPartners.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-100 text-center">
                  No partners are currently assigned to this lead.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedPartners.map((partner: any) => (
                    <div key={partner._id || Math.random()} className="p-3 border border-gray-200 rounded-xl flex items-center justify-between bg-white hover:border-gray-300 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                          <Briefcase className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm truncate" title={partner.businessName}>{partner.businessName || "Partner"}</p>
                          {partner.isVerified && <span className="text-[10px] text-success font-medium flex items-center mt-0.5"><CheckCircle className="w-3 h-3 mr-1" /> Verified</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                Received Bids / Quotes ({bids.length})
              </h3>
              {bids.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-100 text-center">
                  No bids have been received for this lead yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid: any) => {
                    const isAccepted = lead.acceptedBidId === bid._id;
                    const isForwarded = (lead.forwardedBidIds || []).includes(bid._id);
                    
                    return (
                      <div key={bid._id} className={`p-4 border rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all ${
                        isAccepted ? "bg-success/5 border-success/30 shadow-sm" : 
                        isForwarded ? "bg-primary-blue/5 border-primary-blue/30 shadow-sm" : 
                        "bg-white border-gray-200 hover:border-gray-300"
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
                            <span className="font-bold text-lg text-primary-navy">₹{bid.quotedAmount}</span>
                            
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                              bid.status === 'ACCEPTED' ? 'bg-success/10 text-success' : 
                              bid.status === 'REJECTED' ? 'bg-danger/10 text-danger' : 
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {bid.status}
                            </span>

                            {isAccepted && (
                              <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-success text-white flex items-center uppercase shadow-sm">
                                <CheckCircle className="w-3 h-3 mr-1" /> Customer Accepted
                              </span>
                            )}
                            {isForwarded && !isAccepted && (
                              <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-primary-blue text-white flex items-center uppercase shadow-sm">
                                <Share className="w-3 h-3 mr-1" /> Forwarded
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-start md:items-center flex-col md:flex-row md:space-x-4 mt-2">
                            <div>
                              <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Partner Garage</p>
                              <p className="text-sm font-bold text-gray-900">
                                {typeof bid.partnerId === 'object' ? (bid.partnerId?.businessName || bid.partnerId?.ownerName) : (bid.businessName || bid.partnerName || "Partner Garage")}
                              </p>
                              {((typeof bid.partnerId === 'object' && (bid.partnerId?.phone || bid.partnerId?.userId?.phone)) || bid.phone) && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-600 font-medium flex items-center">
                                    <Phone className="w-3 h-3 mr-1 text-primary-orange" />
                                    {(typeof bid.partnerId === 'object' ? (bid.partnerId?.phone || bid.partnerId?.userId?.phone) : bid.phone)}
                                  </span>
                                  <a 
                                    href={`tel:${(typeof bid.partnerId === 'object' ? (bid.partnerId?.phone || bid.partnerId?.userId?.phone) : bid.phone)}`}
                                    className="text-[11px] font-bold text-primary-orange bg-orange-50 px-2 py-0.5 rounded border border-orange-200 hover:bg-orange-100 transition-colors"
                                  >
                                    Call Partner
                                  </a>
                                </div>
                              )}
                              {(bid.partnerId?.businessAddress || bid.businessAddress) && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                  <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                  {bid.partnerId?.businessAddress || bid.businessAddress}
                                </p>
                              )}
                            </div>
                            
                            <div className="hidden md:block w-px h-8 bg-gray-200 mx-2"></div>
                            
                            <div className="mt-3 md:mt-0">
                              <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Duration</p>
                              <p className="text-sm font-medium text-gray-900 flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-gray-400" /> {bid.estimatedDuration || "1-2 hours"}
                              </p>
                            </div>
                          </div>

                          {bid.notes && (
                            <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-xs text-gray-700 italic flex items-start">
                              <span className="font-bold text-primary-orange mr-1.5 font-mono">Note:</span>
                              &quot;{bid.notes}&quot;
                            </div>
                          )}
                        </div>
                        
                        <div className="text-left md:text-right flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center">
                           <div className="text-xs text-gray-400 font-medium whitespace-nowrap">
                             Submitted on:<br/>{new Date(bid.createdAt).toLocaleDateString()}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
          </CardContent>
        </Card>

        {/* Partner Job Completion & Uploaded Invoice Section */}
        <Card className="shadow-subtle border-gray-100 md:col-span-2">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-50 p-2 rounded-lg mr-3">
                  <Wrench className="w-5 h-5 text-primary-orange" />
                </div>
                Partner Job Execution & Invoice Artifacts
              </div>
              <Badge className={`text-xs px-3 py-1 font-bold ${
                lead.job?.status === 'COMPLETED' || lead.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                lead.job?.status === 'IN_PROGRESS' || lead.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-700'
              }`}>
                Job Status: {lead.job?.status || lead.status || 'PENDING'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Uploaded Photos (Before / After / Inspection) */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary-orange" /> Uploaded Workshop Photos
              </h4>

              {(!lead.job?.beforePhotos?.length && !lead.beforePhotos?.length && !lead.job?.afterPhotos?.length && !lead.afterPhotos?.length) ? (
                <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-500 border border-gray-100">
                  No vehicle photos uploaded by partner yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before Photos */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                      Before Service Photos ({ (lead.job?.beforePhotos || lead.beforePhotos || []).length })
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(lead.job?.beforePhotos || lead.beforePhotos || []).map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Before ${idx}`} className="w-20 h-20 object-cover rounded-lg border border-gray-300 shadow-sm group-hover:scale-105 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* After Photos */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                      After Service Photos ({ (lead.job?.afterPhotos || lead.afterPhotos || []).length })
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(lead.job?.afterPhotos || lead.afterPhotos || []).map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`After ${idx}`} className="w-20 h-20 object-cover rounded-lg border border-gray-300 shadow-sm group-hover:scale-105 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Partner Submitted Invoice & Document Links */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary-orange" /> Partner Submitted Invoice
              </h4>

              {lead.invoice || lead.job?.invoiceUrl || lead.invoiceUrl ? (
                <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-gray-900 font-heading">
                        Invoice Amount: ₹{(lead.invoice?.grandTotal || lead.finalAmount || 0).toLocaleString('en-IN')}
                      </span>
                      {lead.invoice?.taxAmount > 0 && (
                        <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                          Includes 18% GST (₹{lead.invoice.taxAmount})
                        </span>
                      )}
                    </div>
                    {lead.invoice?.items?.length > 0 && (
                      <p className="text-xs text-gray-600 font-medium mt-1">
                        Itemized Parts: {lead.invoice.items.map((i: any) => `${i.description} (x${i.quantity})`).join(', ')}
                      </p>
                    )}
                  </div>

                  {(lead.invoice?.pdfUrl || lead.job?.invoiceUrl || lead.invoiceUrl) && (
                    <Button asChild className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm">
                      <a href={lead.invoice?.pdfUrl || lead.job?.invoiceUrl || lead.invoiceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1.5" /> View Partner PDF Invoice
                      </a>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-500 border border-gray-100">
                  No invoice submitted by partner for this lead yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
