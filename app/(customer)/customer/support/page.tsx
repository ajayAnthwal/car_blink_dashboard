// @ts-nocheck
"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HelpCircle, Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  useCustomerBookings, 
  useSupportTickets, 
  useCreateSupportTicket, 
  useReplySupportTicket 
} from "@/features/customer/hooks/useCustomerQueries";
import { QueryForm, QueryFormValues } from "@/features/customer/components/support/QueryForm";

interface Ticket {
  _id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  bookingId?: {
    vehicleId?: { brand: string; model: string };
  };
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
  
  const totalCount = ticketsData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const createTicketMutation = useCreateSupportTicket();
  const replyTicketMutation = useReplySupportTicket();

  const [message, setMessage] = useState({ type: "", text: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const handleCreateTicket = (data: QueryFormValues) => {
    setMessage({ type: "", text: "" });
    createTicketMutation.mutate(data, {
      onSuccess: () => {
        setMessage({ type: "success", text: "Query submitted successfully!" });
      },
      onError: (err: unknown) => {
        setMessage({ type: "error", text: (err as Error)?.message || "Failed to submit query" });
      }
    });
  };

  const handleViewDetails = (ticket: Ticket) => {
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
          setSelectedTicket((prev: Ticket | null) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'bg-danger/10 text-danger border-danger/20';
      case 'MEDIUM': return 'bg-warning/10 text-warning border-warning/20';
      case 'LOW': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN': return 'bg-success/10 text-success border-success/20';
      case 'IN_PROGRESS': return 'bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20';
      case 'RESOLVED': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 container px-4 sm:px-6 md:px-8 mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Help & Support</h2>
          <p className="text-gray-500 mt-1">Have a question? We&apos;re here to help.</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm border font-medium ${
          message.type === "success" 
            ? "bg-success/10 text-success border-success/20" 
            : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {message.text}
        </div>
      )}

      <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-orange-50 p-2 rounded-xl text-primary-orange">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span>Create Query</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QueryForm 
            bookings={bookings} 
            onSubmit={handleCreateTicket} 
            isSubmitting={createTicketMutation.isPending} 
          />
        </CardContent>
      </Card>

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
          <h3 className="text-2xl font-bold text-gray-900 font-heading tracking-tight">
            Your Queries {totalCount > 0 && `(${totalCount})`}
          </h3>
          <div className="w-full sm:w-64">
            <Input 
              placeholder="Search by query title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        
        {isLoadingTickets ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Loading queries...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <HelpCircle className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No queries found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-subtle border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-500">
                    <th className="py-4 px-6 uppercase tracking-wider">Subject</th>
                    <th className="py-4 px-6 uppercase tracking-wider">Booking</th>
                    <th className="py-4 px-6 uppercase tracking-wider">Priority</th>
                    <th className="py-4 px-6 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((ticket: Ticket) => (
                    <React.Fragment key={ticket._id}>
                      <tr 
                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${expandedId === ticket._id ? 'bg-gray-50/50' : ''}`}
                        onClick={() => handleViewDetails(ticket)}
                      >
                        <td className="py-4 px-6">
                          <p className="font-heading font-bold text-gray-900 line-clamp-1">{ticket.subject}</p>
                          <p className="text-xs text-neutral-muted line-clamp-1 mt-1">{ticket.description}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-gray-900">
                            {ticket.bookingId?.vehicleId?.brand} {ticket.bookingId?.vehicleId?.model}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button className="text-neutral-muted hover:text-primary-navy p-1 transition-colors">
                            {expandedId === ticket._id ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedId === ticket._id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-b border-gray-100 bg-white">
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                <span className="text-sm text-gray-500 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-gray-200 hover:bg-gray-50 hover:text-primary-navy text-gray-600 rounded-lg"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoadingTickets}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-gray-200 hover:bg-gray-50 hover:text-primary-navy text-gray-600 rounded-lg"
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
