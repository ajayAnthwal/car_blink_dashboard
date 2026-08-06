"use client";

import React, { useState, useEffect } from "react";
import { getAllWebsiteLeads } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Megaphone, Phone, Mail, Car, MapPin, Calendar, ExternalLink, X } from "lucide-react";
import { format } from "date-fns";

export default function MarketingLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await getAllWebsiteLeads(1, 100);
      let leadsArray = [];
      if (Array.isArray(res)) leadsArray = res;
      else if (res?.data && Array.isArray(res.data)) leadsArray = res.data;
      else if (res?.data?.leads && Array.isArray(res.data.leads)) leadsArray = res.data.leads;
      else if (res?.docs && Array.isArray(res.docs)) leadsArray = res.docs;
      
      setLeads(leadsArray);
    } catch (error) {
      console.error("Failed to load website leads", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

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
                    leads.map((lead: any) => (
                      <tr 
                        key={lead._id} 
                        className="hover:bg-orange-50/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
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

      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4 sticky top-0 bg-white z-10">
              <CardTitle className="text-xl text-primary-navy">Lead Details</CardTitle>
              <button 
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Name</h4>
                    <p className="font-medium text-gray-900">{selectedLead.name}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact</h4>
                    <p className="font-medium text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-primary-orange" /> 
                      <a href={`tel:${selectedLead.phone}`} className="hover:underline">{selectedLead.phone}</a>
                    </p>
                    {selectedLead.email && (
                      <p className="font-medium text-gray-900 flex items-center mt-1">
                        <Mail className="w-4 h-4 mr-2 text-primary-orange" /> 
                        <a href={`mailto:${selectedLead.email}`} className="hover:underline">{selectedLead.email}</a>
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle</h4>
                    <p className="font-medium text-gray-900">
                      {selectedLead.vehicleBrand || selectedLead.vehicleModel ? `${selectedLead.vehicleBrand || ''} ${selectedLead.vehicleModel || ''}` : 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Source</h4>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      selectedLead.source === 'QUICK_CALLBACK' ? 'bg-blue-100 text-blue-700' :
                      selectedLead.source === 'WEBSITE_QUOTE' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedLead.source?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Submitted At</h4>
                    <p className="font-medium text-gray-900">
                      {selectedLead.createdAt ? format(new Date(selectedLead.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Query / Message</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedLead.message || 'No message provided.'}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-primary-orange" /> Location Map
                </h4>
                {selectedLead.city ? (
                  <div className="rounded-lg overflow-hidden border border-gray-200 h-64 bg-gray-100">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight={0} 
                      marginWidth={0} 
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedLead.city)}&output=embed`}
                    ></iframe>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No location provided.</p>
                )}
                {selectedLead.city && (
                  <p className="text-xs text-gray-500 mt-2 flex justify-between">
                    <span>Address/Coords: {selectedLead.city}</span>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.city)}`} target="_blank" rel="noopener noreferrer" className="text-primary-orange hover:underline font-semibold flex items-center">
                      Open in Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
