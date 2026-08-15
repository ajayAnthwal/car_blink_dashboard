"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Bell, X } from "lucide-react";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

// Helper to play a clean, crisp Web Audio chime notification sound
const playNotificationSound = (type: 'lead' | 'alert' | 'info' = 'lead') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'lead' || type === 'alert') {
      // High double chime for new lead / alert
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    } else {
      // Standard notification tone
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now); // E5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.log("[SOCKET] Audio playback prevented by browser:", err);
  }
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type?: string; id: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
    const socketBaseUrl = API_URL.replace("/api", "");

    const newSocket = io(socketBaseUrl, {
      auth: {
        token: accessToken
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("[SOCKET] Connected to live server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("[SOCKET] Disconnected from live server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("[SOCKET] Connection error:", error.message);
    });

    const triggerToast = (title: string, message: string, type: string = 'info', duration: number = 7000) => {
      const toastId = Date.now();
      setToast({ title, message, type, id: toastId });
      playNotificationSound(type as any);

      setTimeout(() => {
        setToast((current) => current?.id === toastId ? null : current);
      }, duration);
    };

    // 1. Listen to new incoming leads (Website / Callbacks / Quotes)
    newSocket.on("new_lead", (payload) => {
      console.log("[SOCKET] Live New Lead Received:", payload);
      const sourceName = payload?.source ? payload.source.replace(/_/g, ' ') : 'Website';
      const title = "🔔 NEW LEAD RECEIVED!";
      const message = payload?.message || `A new lead has arrived from ${sourceName}. Click or check dashboard to view.`;
      triggerToast(title, message, 'lead', 8000);
    });

    // 1b. Listen to partner bid placed
    const handlePartnerBid = (payload: any) => {
      console.log("[SOCKET] Live Partner Bid Received:", payload);
      const title = "🏷️ NEW PARTNER BID PLACED!";
      const partnerName = payload?.partnerName || payload?.businessName || "A partner";
      const amountStr = payload?.amount ? `₹${payload.amount}` : "";
      const message = payload?.message || `${partnerName} has placed a bid ${amountStr} on a booking.`;
      triggerToast(title, message, 'lead', 8000);
    };

    newSocket.on("new_bid", handlePartnerBid);
    newSocket.on("quote_received", handlePartnerBid);

    // 1c. Listen to customer satisfaction response
    newSocket.on("satisfaction_response", (payload: any) => {
      console.log("[SOCKET] Satisfaction Response Received:", payload);
      const isSatisfied = payload?.isSatisfied;
      const title = isSatisfied ? "💚 CUSTOMER SATISFIED!" : "🔴 CUSTOMER REPORTED ISSUES!";
      const customerName = payload?.customerName || "Customer";
      const ratingStr = payload?.rating ? `(${payload.rating}/5 Stars)` : "";
      const message = `${customerName} responded ${isSatisfied ? "Satisfied" : "Dissatisfied"} ${ratingStr}. ${payload?.feedback || ""}`;
      triggerToast(title, message, isSatisfied ? 'lead' : 'info', 10000);
    });

    // 2. Listen to generic system notifications
    newSocket.on("notification:new", (payload) => {
      console.log("[SOCKET] New Notification Received:", payload);
      const title = payload.title || "New Notification";
      const message = payload.message || "You have a new system update.";
      triggerToast(title, message, 'info');
    });

    // 3. Listen to booking confirmed
    newSocket.on("booking_confirmed", (payload) => {
      console.log("[SOCKET] Booking Confirmed Received:", payload);
      triggerToast("✅ Booking Confirmed", payload?.message || "A booking has been confirmed.", 'info');
    });

    // 4. Listen to new escalations
    newSocket.on("new_escalation", (payload) => {
      console.log("[SOCKET] New Escalation Received:", payload);
      triggerToast("⚠️ New Escalation Created", payload?.message || "An urgent escalation requires attention.", 'alert', 9000);
    });

    // 5. Listen to payment updates
    newSocket.on("payment_status_update", (payload) => {
      console.log("[SOCKET] Payment Status Update Received:", payload);
      const title = "💳 Payment Update";
      const message = `Payment of ₹${payload.amount || ''} is now ${payload.status || 'processed'}.`;
      triggerToast(title, message, 'info');
      window.dispatchEvent(new CustomEvent("refetch_payments"));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [accessToken, isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
      
      {/* Global Live Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white border-2 border-orange-500/40 shadow-2xl rounded-2xl p-4 w-96 max-w-[calc(100vw-2rem)] flex items-start space-x-3.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
            <div className="bg-orange-100 p-2.5 rounded-xl flex-shrink-0 text-orange-600 mt-0.5">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                {toast.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed font-medium">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
