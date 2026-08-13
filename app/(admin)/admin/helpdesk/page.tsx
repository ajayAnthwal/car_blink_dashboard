// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminTickets } from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, LifeBuoy, ChevronRight, MessageSquareWarning } from "lucide-react";

export default function AdminHelpdeskPage() {
  const [statusFilter, setStatusFilter] = useState("");
  
  const { data: ticketsData, isLoading } = useAdminTickets(1, 50, statusFilter);
  const tickets = ticketsData?.docs || ticketsData?.data || ticketsData || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-navy to-indigo-900 rounded-3xl p-6 flex items-center justify-between shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <LifeBuoy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Helpdesk & Support</h1>
            <p className="text-white/80 mt-1 font-medium">Manage and resolve customer support tickets.</p>
          </div>
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-50 bg-gray-50/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg text-primary-navy font-bold flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-primary-orange" /> Support Tickets
            </CardTitle>
            <select 
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
              <p className="font-medium">Loading tickets...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Ticket Info</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Customer</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Priority</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400 font-medium">No tickets found.</td>
                    </tr>
                  ) : (
                    tickets.map((ticket: unknown) => (
                      <tr key={ticket._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 line-clamp-1">{ticket.subject}</div>
                          <div className="text-xs text-gray-500 mt-1">{new Date(ticket.createdAt).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{ticket.customerId?.fullName}</div>
                          <div className="text-xs text-gray-500">{ticket.customerId?.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ticket.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                            ticket.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-green-100 text-green-700' :
                            ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/helpdesk/${ticket._id}`}>
                            <button className="text-primary-navy hover:text-blue-700 font-medium flex items-center justify-end gap-1 text-sm ml-auto">
                              View <ChevronRight className="w-4 h-4" />
                            </button>
                          </Link>
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
