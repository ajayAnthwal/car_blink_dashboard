"use client";

import React, { useState, useEffect } from "react";
import { getBookings, createSupportTicket, getSupportTickets, getSupportTicketById, replySupportTicket } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HelpCircle, X, Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface Booking {
  _id: string;
  vehicleId: { brand: string; model: string };
  serviceId: { name: string };
}

interface SupportTicket {
  _id: string;
  bookingId: Booking;
  subject: string;
  description: string;
  priority: string;
  status: string;
  messages: Array<{
    _id: string;
    message: string;
    createdAt: string;
    senderRole: string;
  }>;
}

export default function SupportPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  const [bookingId, setBookingId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [replyMessage, setReplyMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [bookingsRes, ticketsRes] = await Promise.all([
        getBookings(),
        getSupportTickets(),
      ]);
      setBookings((Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.docs || bookingsRes?.data || [])));
      const data = (Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes?.docs || ticketsRes?.data || []));
      setTickets(data);
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setIsLoadingBookings(false);
      setIsLoadingTickets(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await createSupportTicket({
        bookingId,
        subject,
        description,
        priority,
      });
      setMessage({ type: "success", text: "Support ticket created successfully!" });
      setBookingId("");
      setSubject("");
      setDescription("");
      setPriority("MEDIUM");
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to create support ticket." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (ticket: SupportTicket) => {
    if (expandedId === ticket._id) {
      setExpandedId(null);
      setSelectedTicket(null);
      return;
    }
    setIsLoadingDetails(true);
    try {
      const res = await getSupportTicketById(ticket._id);
      // The API interceptor returns the ticket object directly, but may alias its array fields.
      // So 'res' is the ticket object itself.
      setSelectedTicket(res._id ? res : (res?.data?._id ? res.data : res));
      setExpandedId(ticket._id);
      setReplyMessage("");
    } catch (err) {
      console.error("Failed to load ticket details", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;
    setIsReplying(true);
    try {
      const res = await replySupportTicket(selectedTicket._id, { message: replyMessage });
      const updatedTicket = res._id ? res : (res?.data?._id ? res.data : res);
      setSelectedTicket(updatedTicket);
      setReplyMessage("");
      setTickets(prev => prev.map(t => t._id === selectedTicket._id ? updatedTicket : t));
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to send reply." });
    } finally {
      setIsReplying(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "HIGH": return "bg-danger/10 text-danger border-danger/20";
      case "MEDIUM": return "bg-warning/10 text-warning border-warning/20";
      case "LOW": return "bg-success/10 text-success border-success/20";
      default: return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return "bg-warning/10 text-warning border-warning/20";
      case "RESOLVED": return "bg-success/10 text-success border-success/20";
      case "CLOSED": return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
      default: return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Support Tickets</h2>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${
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
            <span>Create Support Ticket</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Booking"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                options={bookings.map(b => ({ 
                  value: b._id, 
                  label: `${b.vehicleId?.brand} ${b.vehicleId?.model} - ${b.serviceId?.name}` 
                }))}
                disabled={bookings.length === 0}
                required
              />
              <Select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                ]}
                required
              />
              <div className="md:col-span-2">
                <Input
                  label="Ticket Title / Subject"
                  placeholder="e.g. Need help with my recent booking"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-dark mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-lg border border-neutral-muted/40 bg-neutral-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting} disabled={bookings.length === 0}>
                Create Ticket
              </Button>
            </div>
            {bookings.length === 0 && (
              <p className="text-xs text-neutral-muted">You need at least one booking to create a support ticket.</p>
            )}
          </form>
        </CardContent>
      </Card>

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
          <h3 className="text-2xl font-bold text-gray-900 font-heading tracking-tight">Your Tickets ({tickets.length})</h3>
          <div className="w-full sm:w-64">
            <Input 
              placeholder="Search by ticket title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {isLoadingTickets ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <HelpCircle className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No support tickets yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.filter(t => t.subject.toLowerCase().includes(searchQuery.toLowerCase())).map((ticket) => (
              <Card key={ticket._id} className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => handleViewDetails(ticket)}>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-heading font-bold text-gray-900 text-lg">{ticket.subject}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-muted line-clamp-1">{ticket.description}</p>
                      <p className="text-xs text-neutral-muted mt-1">
                        Booking: {ticket.bookingId?.vehicleId?.brand} {ticket.bookingId?.vehicleId?.model}
                      </p>
                    </div>
                    <button className="text-neutral-muted hover:text-neutral-dark p-1">
                      {expandedId === ticket._id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {expandedId === ticket._id && (
                    <div className="mt-4 pt-4 border-t border-neutral-muted/20">
                      {isLoadingDetails ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
                        </div>
                      ) : selectedTicket && selectedTicket._id === ticket._id ? (
                        <div className="space-y-4">
                          <div className="text-sm text-neutral-muted space-y-1">
                            <p><span className="font-medium text-neutral-dark">Subject:</span> {selectedTicket.subject}</p>
                            <p><span className="font-medium text-neutral-dark">Description:</span> {selectedTicket.description}</p>
                            <p><span className="font-medium text-neutral-dark">Priority:</span> {selectedTicket.priority}</p>
                            <p><span className="font-medium text-neutral-dark">Status:</span> {selectedTicket.status}</p>
                          </div>

                          <div className="space-y-3">
                            <h5 className="font-medium text-primary-navy">Conversation</h5>
                            {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                              <div className="space-y-3 max-h-60 overflow-y-auto">
                                {selectedTicket.messages.map((reply: any) => (
                                  <div
                                    key={reply._id}
                                    className={`p-3 rounded-lg text-sm ${
                                      reply.senderRole === "CUSTOMER"
                                        ? "bg-primary-navy/5 ml-8"
                                        : "bg-neutral-bg mr-8"
                                    }`}
                                  >
                                    <p className="font-medium text-xs text-neutral-muted mb-1">
                                      {reply.senderRole === "CUSTOMER" ? "You" : "Support Team"}
                                    </p>
                                    <p>{reply.message}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-muted">No messages yet.</p>
                            )}
                          </div>

                          <form onSubmit={handleReply} className="flex space-x-3">
                            <Input
                              placeholder="Type your reply..."
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              className="flex-1"
                            />
                            <Button type="submit" size="sm" isLoading={isReplying} disabled={!replyMessage.trim()}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
