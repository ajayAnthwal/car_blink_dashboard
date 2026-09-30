// @ts-nocheck
"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HelpCircle, Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Ticket, CheckCircle, Clock, ShieldCheck, Car, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useCustomerBookings, 
  useSupportTickets, 
  useCreateSupportTicket, 
  useReplySupportTicket 
} from "@/features/customer/hooks/useCustomerQueries";
import { QueryForm, QueryFormValues } from "@/features/customer/components/support/QueryForm";

interface TicketType {
  _id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  bookingId?: any;
  messages?: any[];
}

const ChatInterface = dynamic(
  () => import("@/features/customer/components/support/ChatInterface"),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary-orange animate-spin" />
      </div>
    ),
    ssr: false 
  }
);

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 10;
  
  const { data: bookingsData } = useCustomerBookings();
  const bookings = bookingsData?.bookings || [];

  const { data: ticketsData, isLoading: isLoadingTickets } = useSupportTickets({
    page: currentPage,
    limit,
    search: searchQuery
  });

  const tickets = Array.isArray(ticketsData) 
    ? ticketsData 
    : ticketsData?.tickets || [];
  
  const totalCount = ticketsData?.total || tickets.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const createTicketMutation = useCreateSupportTicket();
  const replyTicketMutation = useReplySupportTicket();

  const [message, setMessage] = useState({ type: "", text: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  const handleCreateTicket = (data: QueryFormValues) => {
    setMessage({ type: "", text: "" });
    createTicketMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["customer", "support-tickets"] });
        setMessage({ type: "success", text: "Query submitted successfully! You can track its live status below." });
      },
      onError: (err: unknown) => {
        setMessage({ type: "error", text: (err as Error)?.message || "Failed to submit query" });
      }
    });
  };

  const handleViewDetails = (ticket: TicketType) => {
    if (expandedId === ticket._id) {
      setExpandedId(null);
      setSelectedTicket(null);
    } else {
      setExpandedId(ticket._id);
      setSelectedTicket(ticket);
    }
  };

  const handleReply = (replyMessage: string) => {
    if (!selectedTicket) return;
    
    replyTicketMutation.mutate(
      { id: selectedTicket._id, message: replyMessage },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["customer", "support-tickets"] });
          setSelectedTicket((prev: TicketType | null) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [
                ...(prev.messages || []),
                {
                  _id: Date.now().toString(),
                  message: replyMessage,
                  senderRole: "CUSTOMER",
                  createdAt: new Date().toISOString(),
                }
              ]
            };
          });
        },
        onError: (err: unknown) => {
          setMessage({ type: "error", text: (err as Error)?.message || "Failed to send reply" });
        }
      }
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': 
        return <span className="bg-rose-100 text-rose-800 border-rose-200 border px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase">High Urgent</span>;
      case 'MEDIUM': 
        return <span className="bg-amber-100 text-amber-800 border-amber-200 border px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">Medium</span>;
      case 'LOW': 
        return <span className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">Low</span>;
      default: 
        return <span className="bg-slate-100 text-slate-700 border-slate-200 border px-2.5 py-0.5 rounded-full text-xs font-bold">{priority}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return (
          <span className="bg-emerald-100 text-emerald-800 border-emerald-300 border px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="bg-blue-100 text-blue-800 border-blue-300 border px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            IN PROGRESS
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="bg-slate-100 text-slate-800 border-slate-300 border px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 shadow-2xs">
            ✓ RESOLVED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="bg-slate-100 text-slate-600 border-slate-200 border px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
            CLOSED
          </span>
        );
      default:
        return <span className="bg-slate-100 text-slate-700 border-slate-200 border px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const getBookingLabel = (ticket: TicketType) => {
    if (!ticket.bookingId) return "General Customer Query";
    if (typeof ticket.bookingId === "object") {
      const b = ticket.bookingId;
      const sName = b.serviceId?.name || "Service Request";
      const vStr = b.vehicleId ? `${b.vehicleId.brand} ${b.vehicleId.model} ${b.vehicleId.registrationNumber ? `(${b.vehicleId.registrationNumber})` : ""}`.trim() : "Vehicle";
      return `${vStr} — ${sName}`;
    }
    return `Booking #${String(ticket.bookingId).slice(-6)}`;
  };

  return (
    <div className="space-y-6 md:space-y-8 container px-4 sm:px-6 md:px-8 mx-auto pb-12 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary-navy via-slate-900 to-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary-orange bg-primary-orange/20 px-3 py-1 rounded-full border border-primary-orange/30 inline-block mb-2">
            24/7 Executive Helpdesk & Support
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">Raise Query & Support Center</h1>
          <p className="text-slate-300 text-sm font-medium mt-1">
            Submit queries linked to your vehicle or booking and track status live: <span className="text-emerald-400 font-bold">Open</span> ➔ <span className="text-blue-400 font-bold">In Progress</span> ➔ <span className="text-slate-200 font-bold">Resolved</span>.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl flex items-center gap-3 shrink-0">
          <Ticket className="w-8 h-8 text-primary-orange" />
          <div>
            <div className="text-2xl font-black">{totalCount}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Total Queries</div>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-sm font-semibold border flex items-center gap-2 ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {message.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form: Raise Query */}
      <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-100 rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-gray-100 pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl font-heading">
            <div className="bg-orange-100 p-2.5 rounded-2xl text-primary-orange">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span>Submit a New Query / Help Ticket</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <QueryForm 
            bookings={bookings} 
            onSubmit={handleCreateTicket} 
            isSubmitting={createTicketMutation.isPending} 
          />
        </CardContent>
      </Card>

      {/* Queries List Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-heading tracking-tight">
              Trackable Customer Queries {totalCount > 0 && `(${totalCount})`}
            </h3>
            <p className="text-xs text-gray-500 font-medium">Click on any query row to view full message history & respond to support executive.</p>
          </div>
          <div className="w-full sm:w-72">
            <Input 
              placeholder="Search by title or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-xl bg-white border-gray-200 text-sm"
            />
          </div>
        </div>
        
        {isLoadingTickets ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">Loading queries...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4 border border-orange-100 text-primary-orange">
              <HelpCircle className="w-10 h-10" />
            </div>
            <p className="text-gray-900 font-bold text-lg font-heading">No support queries found</p>
            <p className="text-gray-500 text-sm mt-1 max-w-md">Once you submit a query for your booking or vehicle, it will appear here with live tracking.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Query Details</th>
                    <th className="py-4 px-6">Linked Booking & Vehicle</th>
                    <th className="py-4 px-6">Priority</th>
                    <th className="py-4 px-6">Live Status</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((ticket: TicketType) => (
                    <React.Fragment key={ticket._id}>
                      <tr 
                        className={`hover:bg-orange-50/30 transition-colors cursor-pointer ${expandedId === ticket._id ? 'bg-orange-50/40' : ''}`}
                        onClick={() => handleViewDetails(ticket)}
                      >
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-mono text-gray-400 font-bold mb-0.5">
                              ID: #{ticket._id.slice(-6).toUpperCase()}
                            </span>
                            <p className="font-heading font-bold text-gray-900 text-base line-clamp-1">{ticket.subject}</p>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{ticket.description}</p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              Created: {new Date(ticket.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-xs text-gray-800 font-bold">
                            <Car className="w-4 h-4 text-primary-orange shrink-0" />
                            <span>{getBookingLabel(ticket)}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          {getPriorityBadge(ticket.priority)}
                        </td>

                        <td className="py-4 px-6">
                          {getStatusBadge(ticket.status)}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary-navy hover:bg-orange-100 font-bold text-xs gap-1 rounded-xl"
                          >
                            <span>{expandedId === ticket._id ? 'Hide Details' : 'Track & Reply'}</span>
                            {expandedId === ticket._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </td>
                      </tr>

                      {expandedId === ticket._id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-b border-gray-200 bg-slate-50/50">
                            <div className="p-6">
                              {selectedTicket && selectedTicket._id === ticket._id && (
                                <ChatInterface
                                  query={selectedTicket}
                                  isLoadingDetails={false}
                                  onReply={handleReply}
                                  isReplying={replyTicketMutation.isPending}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-slate-50 text-xs font-semibold text-gray-600">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoadingTickets}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isLoadingTickets}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
