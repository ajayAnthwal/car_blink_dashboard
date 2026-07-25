"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/features/auth/hooks/useAuth";

// We can use a simple UI element for the toast, or build a custom one.
// For now we'll implement a custom lightweight fixed toast in this provider since we don't know the exact toast library used.
import { Bell, X } from "lucide-react";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; id: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to the backend
    // Typically the API URL is process.env.NEXT_PUBLIC_API_BASE_URL or localhost:8000
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
    
    // The backend uses a base URL like /api usually, but socket is often at the root.
    // We will connect to the root API_URL. If your backend socket path is different, adjust it here.
    const socketBaseUrl = API_URL.replace("/api", "");

    const newSocket = io(socketBaseUrl, {
      auth: {
        token: accessToken
      },
      reconnection: true,
      reconnectionAttempts: 5,
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

    // Listen to global notification events
    newSocket.on("notification:new", (payload) => {
      console.log("[SOCKET] New Notification Received:", payload);
      const title = payload.title || "New Notification";
      const message = payload.message || "You have a new update.";
      
      const toastId = Date.now();
      setToast({ title, message, id: toastId });
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setToast((current) => current?.id === toastId ? null : current);
      }, 5000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [accessToken, isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
      
      {/* Global Live Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-neutral-white border border-neutral-muted/20 shadow-lg rounded-xl p-4 w-80 max-w-[calc(100vw-2rem)] flex items-start space-x-3">
            <div className="bg-primary-orange/10 p-2 rounded-full flex-shrink-0">
              <Bell className="w-5 h-5 text-primary-orange" />
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-sm font-bold text-primary-navy">{toast.title}</h4>
              <p className="text-xs text-neutral-muted mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-neutral-muted hover:text-primary-navy transition-colors flex-shrink-0"
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
