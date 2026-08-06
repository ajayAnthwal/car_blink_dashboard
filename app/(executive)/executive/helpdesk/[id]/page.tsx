"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExecutiveTicketDetails, updateExecutiveTicketStatus, addExecutiveTicketReply } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Send, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function AdminTicketDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) loadTicket();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const res = await getExecutiveTicketDetails(id as string);
      setTicket(res);
    } catch (error) {
      console.error("Failed to load ticket details", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    const confirmAction = window.confirm(`Mark this ticket as ${status}?`);
    if (!confirmAction) return;

    try {
      await updateExecutiveTicketStatus(id as string, status);
      alert(`Ticket marked as ${status}.`);
      loadTicket();
    } catch (error: any) {
      alert(error?.message || "Failed to update status.");
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsSending(true);
    try {
      await addExecutiveTicketReply(id as string, replyMessage);
      setReplyMessage("");
      loadTicket();
    } catch (error: any) {
      alert(error?.message || "Failed to send reply.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
        <p className="text-gray-500 font-medium">Loading ticket details...</p>
      </div>
    );
  }

  if (!ticket) return <div className="p-8 text-center text-red-500 font-bold">Ticket not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-12 p-4">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Helpdesk
      </button>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-gray-500 font-mono">#{ticket._id?.slice(-8).toUpperCase()}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              ticket.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
              ticket.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {ticket.priority} PRIORITY
            </span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-primary-navy">{ticket.subject}</h1>
          <p className="text-gray-500 mt-2 text-sm max-w-2xl">{ticket.description}</p>
        </div>
        
        <div className="flex flex-col items-end gap-3 border-l border-gray-100 pl-6">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</p>
            <p className={`font-bold mt-1 ${
              ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'text-green-600' : 'text-orange-500'
            }`}>{ticket.status}</p>
          </div>
          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateStatus('RESOLVED')}
                className="bg-green-100 hover:bg-green-200 text-green-700 font-bold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" /> Resolve
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Customer Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/90 shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-sm text-primary-navy font-bold uppercase tracking-wider">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-bold">Name</p>
                <p className="font-medium text-gray-900">{ticket.customerId?.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold">Contact</p>
                <p className="font-medium text-gray-900">{ticket.customerId?.phone}</p>
                <p className="font-medium text-gray-900">{ticket.customerId?.email}</p>
              </div>
              {ticket.bookingId && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-bold mb-1">Related Booking</p>
                  <Link href={`/executive/bookings/${ticket.bookingId._id}`}>
                    <span className="text-blue-600 hover:underline text-sm font-medium">View Booking ↗</span>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Messages Thread */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm border-gray-200 h-[600px] flex flex-col">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3">
              <CardTitle className="text-sm text-primary-navy font-bold">Conversation</CardTitle>
            </CardHeader>
            
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                
                {/* Initial Description as first message */}
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 max-w-[80%] shadow-sm">
                    <p className="text-xs text-gray-500 font-bold mb-1">{ticket.customerId?.fullName} <span className="font-normal text-gray-400">• Customer</span></p>
                    <p className="text-gray-800 text-sm">{ticket.description}</p>
                    <p className="text-[10px] text-gray-400 mt-2 text-right">{new Date(ticket.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Replies */}
                {ticket.messages?.map((msg: any, idx: number) => {
                  const isAdmin = msg.senderRole === 'SUPER_ADMIN' || msg.senderRole === 'ADMIN' || msg.senderRole === 'EXECUTIVE';
                  return (
                    <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-2xl p-4 max-w-[80%] shadow-sm ${
                        isAdmin ? 'bg-primary-navy text-white rounded-tr-sm' : 'bg-white border border-gray-100 rounded-tl-sm'
                      }`}>
                        <p className={`text-xs font-bold mb-1 ${isAdmin ? 'text-white/80' : 'text-gray-500'}`}>
                          {isAdmin ? (msg.senderRole === 'EXECUTIVE' ? 'Executive' : 'Super Admin') : ticket.customerId?.fullName} 
                        </p>
                        <p className={`text-sm ${isAdmin ? 'text-white' : 'text-gray-800'}`}>{msg.message}</p>
                        <p className={`text-[10px] mt-2 text-right ${isAdmin ? 'text-white/60' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') ? (
                <div className="p-4 bg-white border-t border-gray-100">
                  <form onSubmit={handleSendReply} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Type your reply here..."
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-navy text-sm bg-gray-50 focus:bg-white transition-colors"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      disabled={isSending}
                    />
                    <button
                      type="submit"
                      disabled={isSending || !replyMessage.trim()}
                      className="bg-primary-navy hover:bg-blue-900 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500 font-medium flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" /> This ticket is {ticket?.status?.toLowerCase() || 'closed'} and cannot receive new replies.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
