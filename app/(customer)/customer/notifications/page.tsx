"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell, Info, CheckCircle2, AlertTriangle, CalendarCheck, Clock, Settings, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/services";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      const docs = (Array.isArray(res) ? res : (res?.docs || res?.data || []));
      setNotifications(docs);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string | number) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await markNotificationAsRead(id);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "CalendarCheck": return <CalendarCheck className="w-5 h-5 text-success" />;
      case "Wrench": return <Wrench className="w-5 h-5 text-primary-blue" />;
      case "AlertTriangle": return <AlertTriangle className="w-5 h-5 text-danger" />;
      case "Info": return <Info className="w-5 h-5 text-primary-orange" />;
      case "CheckCircle2": return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "Settings": return <Settings className="w-5 h-5 text-gray-500" />;
      default: return <Bell className="w-5 h-5 text-primary-navy" />;
    }
  };

  const filteredNotifications = activeTab === "all"
    ? notifications
    : notifications.filter(n => n.read === (activeTab === "read"));

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Notifications</h2>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="h-8" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex space-x-1 p-1 bg-white/50 backdrop-blur-sm rounded-xl border border-white/40 max-w-md">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === "all"
              ? "bg-white shadow-sm text-primary-navy border border-gray-100"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setActiveTab("unread")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${activeTab === "unread"
              ? "bg-white shadow-sm text-primary-navy border border-gray-100"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="bg-primary-orange text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40 overflow-hidden">
        <div className="divide-y divide-gray-100/50">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                className={`p-5 flex items-start space-x-4 transition-colors duration-200 hover:bg-neutral-bg/50 cursor-pointer ${!notification.read ? "bg-orange-50/30" : ""
                  }`}
              >
                <div className={`p-3 rounded-2xl flex-shrink-0 ${!notification.read ? "bg-white shadow-sm border border-orange-100/50" : "bg-gray-50 border border-gray-100"
                  }`}>
                  {getIcon(notification.iconName || notification.icon)}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-base font-semibold font-heading tracking-tight ${!notification.read ? "text-gray-900" : "text-gray-700"
                      }`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs font-medium text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {notification.time}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${!notification.read ? "text-gray-700 font-medium" : "text-gray-500"
                    }`}>
                    {notification.description}
                  </p>
                </div>

                {!notification.read && (
                  <div className="flex-shrink-0 pt-2">
                    <div className="w-2.5 h-2.5 bg-primary-orange rounded-full shadow-sm"></div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <Bell className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-heading tracking-tight mb-2">No Notifications</h3>
              <p className="text-gray-500 font-medium">You're all caught up! You have no new notifications right now.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
