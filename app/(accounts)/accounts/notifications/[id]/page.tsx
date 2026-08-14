"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  useAccountsNotifications, 
  useMarkNotificationReadMutation 
} from "@/features/accounts/hooks/useAccountsQueries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, Info, CalendarClock, Zap, Clock } from "lucide-react";
import { format } from "date-fns";

export default function NotificationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params.id as string;
  
  const { data: notificationsData, isLoading } = useAccountsNotifications();
  const markReadMutation = useMarkNotificationReadMutation();
  const [markedRead, setMarkedRead] = useState(false);

  const notifications = notificationsData || [];
  const notification = notifications.find((n: any) => n._id === notificationId);

  useEffect(() => {
    if (notification && !notification.isRead && !markedRead) {
      markReadMutation.mutateAsync(notification._id)
        .then(() => setMarkedRead(true))
        .catch(err => console.error("Failed to mark as read", err));
    }
  }, [notification, markedRead, markReadMutation]);

  const getIconForType = (type: string) => {
    switch (type) {
      case "SYSTEM":
        return <Info className="w-6 h-6 text-secondary-blue" />;
      case "BID_RECEIVED":
        return <Zap className="w-6 h-6 text-primary-orange" />;
      case "BOOKING_UPDATE":
      case "PAYMENT_UPDATE":
        return <CalendarClock className="w-6 h-6 text-primary-navy" />;
      default:
        return <Bell className="w-6 h-6 text-neutral-muted" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-1/4 mb-6"></div>
        <div className="h-48 bg-neutral-200 rounded-3xl"></div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-primary-navy mb-4">Notification Not Found</h2>
        <p className="text-neutral-muted mb-6">The message you are looking for does not exist or has been deleted.</p>
        <Button asChild className="bg-primary-orange hover:bg-primary-orange-dark">
          <Link href="/accounts/notifications">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Notifications
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/accounts/notifications")} className="rounded-full hover:bg-neutral-muted/10">
          <ArrowLeft className="w-5 h-5 text-neutral-dark" />
        </Button>
        <h1 className="text-2xl font-bold text-primary-navy">Message Details</h1>
      </div>

      <Card className="shadow-subtle border-neutral-muted/10">
        <CardHeader className="pb-4 border-b border-neutral-muted/10">
          <div className="flex items-start gap-4">
            <div className="bg-neutral-muted/10 p-3 rounded-xl">
              {getIconForType(notification.type || notification.category)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-primary-navy">
                {notification.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-neutral-muted font-medium">
                <Clock className="w-4 h-4" />
                {notification.createdAt ? format(new Date(notification.createdAt), 'PPP p') : 'Unknown time'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-sm max-w-none text-neutral-dark whitespace-pre-wrap leading-relaxed">
            {notification.message}
          </div>
          
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div className="mt-8 pt-6 border-t border-neutral-muted/10">
              <h4 className="text-sm font-bold text-primary-navy uppercase tracking-wider mb-3">Additional Details</h4>
              <div className="bg-neutral-bg/50 p-4 rounded-xl text-sm font-mono text-neutral-dark break-all overflow-auto">
                <pre>{JSON.stringify(notification.metadata, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
         <Button variant="outline" asChild className="border-neutral-muted/20 hover:bg-neutral-muted/10 text-neutral-dark">
            <Link href="/accounts/notifications">View All Notifications</Link>
         </Button>
      </div>
    </div>
  );
}
