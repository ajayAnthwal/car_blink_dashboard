"use client";

import React, { useState, useEffect } from "react";
import { getSuperAdminNotifications, sendSuperAdminNotification } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Bell, Send, History } from "lucide-react";

export default function AdminNotificationsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAudience, setTargetAudience] = useState("ALL");

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await getSuperAdminNotifications();
      setHistory(res.data || []);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return alert("Please fill all fields.");

    const confirmSend = window.confirm(`Send this notification to ${targetAudience}?`);
    if (!confirmSend) return;

    setIsSending(true);
    try {
      await sendSuperAdminNotification({ title, body, targetAudience });
      alert("Notification dispatched successfully!");
      setTitle("");
      setBody("");
      fetchHistory();
    } catch (error: any) {
      alert("Failed to send notification.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-navy to-indigo-900 rounded-3xl p-6 flex items-center justify-between shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Push Notifications</h1>
            <p className="text-white/80 mt-1 font-medium">Broadcast alerts and offers to your users.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Compose */}
        <div className="lg:col-span-1">
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200 sticky top-24">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-orange" /> Compose Message
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Target Audience</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm font-bold bg-gray-50"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  >
                    <option value="ALL">All Users (Customers & Partners)</option>
                    <option value="CUSTOMERS">Customers Only</option>
                    <option value="PARTNERS">Partners (Garages) Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Notification Title</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Big Diwali Sale!"
                    maxLength={50}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <p className="text-[10px] text-right text-gray-400 mt-1">{title.length}/50</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Message Body</label>
                  <textarea 
                    placeholder="Get 20% off on all car washes today..."
                    rows={4}
                    maxLength={150}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm resize-none"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <p className="text-[10px] text-right text-gray-400 mt-1">{body.length}/150</p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSending || !title || !body}
                  className="w-full mt-2 bg-primary-navy hover:bg-blue-900 text-white font-bold py-3 rounded-xl transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Bell className="w-4 h-4" /> Broadcast Now</>}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <History className="w-5 h-5 text-primary-orange" /> Sent History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
                  <p className="font-medium">Loading history...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 font-bold tracking-wider w-1/2">Message Details</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Audience</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Sent Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-10 text-gray-400 font-medium">No notifications sent yet.</td>
                        </tr>
                      ) : (
                        history.map((item: any) => (
                          <tr key={item._id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900">{item.title}</div>
                              <div className="text-sm text-gray-600 mt-1 line-clamp-2">{item.body}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                item.targetAudience === 'ALL' ? 'bg-purple-100 text-purple-700' :
                                item.targetAudience === 'CUSTOMERS' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {item.targetAudience}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-xs text-gray-500 font-medium">{new Date(item.sentAt).toLocaleString()}</div>
                              <div className="text-[10px] text-gray-400 mt-1">by {item.sentBy?.fullName || 'Admin'}</div>
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

      </div>
    </div>
  );
}
