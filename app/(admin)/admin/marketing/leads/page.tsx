// @ts-nocheck
"use client";

import React from "react";
import { useAdminWebsiteLeads } from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Megaphone, Phone, Mail, Car, MapPin, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function MarketingLeadsPage() {
  const { data: res, isLoading } = useAdminWebsiteLeads(1, 100);
  
  let leads: unknown[] = [];
  if (Array.isArray(res)) leads = res;
  else if (res?.data && Array.isArray(res.data)) leads = res.data;
  else if (res?.data?.leads && Array.isArray(res.data.leads)) leads = res.data.leads;
  else if (res?.docs && Array.isArray(res.docs)) leads = res.docs;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-orange to-red-500 rounded-3xl p-6 flex items-center justify-between shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Website Leads</h1>
            <p className="text-white/90 mt-1 font-medium">View quotes and callback requests from the website.</p>
          </div>
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary-orange" /> Lead Submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-orange" />
              <p className="font-medium">Loading leads...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Customer Details</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Contact Info</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Vehicle & Location</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Source</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Query / Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400 font-medium">No leads generated yet.</td>
                    </tr>
                  ) : (
                    leads.map((lead: unknown) => (
                      <tr key={lead._id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{lead.name}</div>
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {lead.createdAt ? format(new Date(lead.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600 mb-1">
                            <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                            <a href={`tel:${lead.phone}`} className="hover:text-primary-orange">{lead.phone}</a>
                          </div>
                          {lead.email && (
                            <div className="flex items-center text-gray-600">
                              <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                              <a href={`mailto:${lead.email}`} className="hover:text-primary-orange">{lead.email}</a>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-700 font-medium mb-1">
                            <Car className="w-4 h-4 mr-2 text-gray-500" />
                            {lead.vehicleBrand || lead.vehicleModel ? `${lead.vehicleBrand || ''} ${lead.vehicleModel || ''}` : 'Not provided'}
                          </div>
                          <div className="flex items-center text-gray-500 text-xs">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
                            {lead.city || 'Not provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            lead.source === 'QUICK_CALLBACK' ? 'bg-blue-100 text-blue-700' :
                            lead.source === 'WEBSITE_QUOTE' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {lead.source?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600 text-xs line-clamp-3 max-w-xs" title={lead.message}>
                            {lead.message || 'No message provided.'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
