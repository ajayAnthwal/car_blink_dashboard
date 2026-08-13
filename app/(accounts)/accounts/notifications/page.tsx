// @ts-nocheck
"use client";

import React, { useEffect } from "react";
import { 
  useAccountsNotifications, 
  useMarkNotificationReadMutation, 
  useMarkAllNotificationsReadMutation 
} from "@/features/accounts/hooks/useAccountsQueries";
import { useSocket } from "@/lib/SocketContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Loader2, CheckCircle2, Info, CalendarClock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const { socket } = useSocket();
  const { data: notificationsData, isLoading, refetch } = useAccountsNotifications();
  const notifications = notificationsData || [];
  
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  useEffect(() => {
    if (!socket) return;
    
    // Listen for new notifications
    const handleNewNotification = () => {
      refetch();
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("new_notification", handleNewNotification);
    socket.on("notification_received", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("new_notification", handleNewNotification);
      socket.off("notification_received", handleNewNotification);
    };
  }, [socket, refetch]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await markReadMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "SYSTEM":
        return <Info className="w-5 h-5 text-secondary-blue" />;
      case "BID_RECEIVED":
        return <Zap className="w-5 h-5 text-primary-orange" />;
      case "BOOKING_UPDATE":
        return <CalendarClock className="w-5 h-5 text-primary-navy" />;
      default:
        return <Bell className="w-5 h-5 text-neutral-muted" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Notifications</h1>
          <p className="text-neutral-muted text-sm mt-1">
            You have <span className="font-medium text-primary-orange">{unreadCount}</span> unread messages
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            className="flex items-center text-sm border-neutral-muted/20 hover:bg-neutral-muted/10 text-neutral-dark"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-neutral-white rounded-2xl shadow-sm border border-neutral-muted/20">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-neutral-white p-12 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <Bell className="w-12 h-12 text-neutral-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary-navy mb-1">No notifications yet</h3>
          <p className="text-neutral-muted text-sm">We&apos;ll notify you when something important happens.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification._id} 
              className={`transition-colors cursor-pointer border-l-4 hover:shadow-md ${
                notification.isRead 
                  ? 'bg-neutral-white border-l-transparent border-neutral-muted/20' 
                  : 'bg-primary-navy/5 border-l-primary-orange border-neutral-muted/10'
              }`}
              onClick={() => handleMarkAsRead(notification._id, notification.isRead)}
            >
              <CardContent className="p-4 sm:p-5 flex gap-4">
                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.isRead ? 'bg-neutral-muted/10' : 'bg-white shadow-sm'
                }`}>
                  {getIconForType(notification.type || notification.category)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className={`text-base font-semibold truncate ${notification.isRead ? 'text-neutral-dark' : 'text-primary-navy'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-neutral-muted whitespace-nowrap mt-1">
                      {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <p className={`text-sm ${notification.isRead ? 'text-neutral-muted' : 'text-neutral-dark'}`}>
                    {notification.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
