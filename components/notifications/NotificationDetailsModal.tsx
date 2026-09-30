// @ts-nocheck
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Bell, Info, Zap, CalendarClock, CreditCard, CheckCircle2, ExternalLink, Clock, User, Building2, FileText, Tag } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface NotificationDetailsModalProps {
  notification: any | null;
  onClose: () => void;
  userRole?: string;
}

export const getNotificationTargetLink = (notification: any, userRole: string = "SUPER_ADMIN") => {
  if (!notification) return null;
  const payload = notification.metadata || notification.data || notification.payload || {};
  const category = (notification.category || notification.type || "").toUpperCase();
  const titleLower = (notification.title || "").toLowerCase();
  const msgLower = (notification.message || "").toLowerCase();
  const role = (userRole || "").toUpperCase();

  const bId = payload.bookingId || payload.leadId || payload.id || notification.metadata?.bookingId || notification.metadata?.leadId;
  const ticketId = payload.ticketId || payload.ticket_id || payload.queryId || notification.metadata?.ticketId;
  const partnerId = payload.partnerId || payload.partner_id || payload.workshopId || notification.metadata?.partnerId;
  const invoiceId = payload.invoiceId || payload.invoice_id || notification.metadata?.invoiceId;
  const settlementId = payload.settlementId || payload.settlement_id || payload.refundId || notification.metadata?.settlementId;
  const warrantyId = payload.warrantyId || payload.warranty_id || notification.metadata?.warrantyId;
  const userId = payload.userId || payload.user_id || notification.metadata?.userId;

  // 1. Extra Parts / Additional Parts Approval / Job Extensions
  if (
    titleLower.includes("part") ||
    msgLower.includes("part") ||
    titleLower.includes("extra") ||
    msgLower.includes("extra") ||
    titleLower.includes("extension") ||
    msgLower.includes("extension")
  ) {
    if (role === "PARTNER") return { label: "View Partner Jobs", href: "/partner/jobs" };
    if (role === "CUSTOMER") return { label: "Review Extra Parts", href: bId ? `/customer/bookings/${bId}` : "/customer/bookings" };
    if (role === "SUPER_ADMIN" || role === "ADMIN") return { label: "View Booking Details", href: bId ? `/admin/bookings/${bId}` : "/admin/bookings" };
    if (role === "EXECUTIVE") return { label: "View Booking Details", href: "/executive/leads" };
    return { label: "View Bookings", href: "/admin/bookings" };
  }

  // 2. Invoice Notifications
  if (payload.invoiceId || titleLower.includes("invoice") || msgLower.includes("invoice")) {
    if (role === "PARTNER") return { label: "View Active Jobs & Invoices", href: "/partner/jobs" };
    if (role === "CUSTOMER") return { label: "View Booking & Invoice", href: bId ? `/customer/bookings/${bId}` : "/customer/dashboard" };
    if (role === "ACCOUNTS") return { label: "View Accounts Invoices", href: "/accounts/invoices" };
    if (role === "SUPER_ADMIN" || role === "ADMIN") return { label: "View Invoices & Finance", href: "/admin/finance" };
    if (role === "EXECUTIVE") return { label: "Go to Executive Invoice Console", href: "/executive/invoices" };
    return { label: "View Invoices", href: "/admin/finance" };
  }

  // 3. Customer Query / Support Ticket / Helpdesk
  if (
    ticketId ||
    titleLower.includes("query") ||
    msgLower.includes("query") ||
    titleLower.includes("ticket") ||
    msgLower.includes("ticket") ||
    titleLower.includes("support") ||
    msgLower.includes("help")
  ) {
    if (role === "CUSTOMER") return { label: "View My Queries", href: "/customer/support" };
    if (role === "SUPER_ADMIN" || role === "ADMIN") return { label: "View Helpdesk Tickets", href: ticketId ? `/admin/helpdesk/${ticketId}` : "/admin/helpdesk" };
    if (role === "EXECUTIVE") return { label: "View Helpdesk Tickets", href: ticketId ? `/executive/helpdesk/${ticketId}` : "/executive/helpdesk" };
    return { label: "View Helpdesk", href: "/admin/helpdesk" };
  }

  // 4. Booking / Quote / Lead Updates
  if (
    bId ||
    titleLower.includes("booking") ||
    msgLower.includes("booking") ||
    titleLower.includes("quote") ||
    msgLower.includes("quote")
  ) {
    if (role === "PARTNER") return { label: "View Partner Jobs", href: "/partner/jobs" };
    if (role === "CUSTOMER") return { label: "View Booking Details", href: bId ? `/customer/bookings/${bId}` : "/customer/bookings" };
    if (role === "SUPER_ADMIN" || role === "ADMIN") return { label: "View Booking Details", href: bId ? `/admin/bookings/${bId}` : "/admin/bookings" };
    if (role === "EXECUTIVE") return { label: "View Leads & Bookings", href: "/executive/leads" };
    return { label: "View Bookings", href: "/admin/bookings" };
  }

  // 5. Partner Registration & Status
  if (partnerId || titleLower.includes("partner") || msgLower.includes("partner")) {
    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      return { label: "Review & Manage Partner", href: partnerId ? `/admin/partners/${partnerId}` : "/admin/partners" };
    }
    if (role === "EXECUTIVE") {
      return { label: "Review & Verify Partner", href: "/executive/partner-status" };
    }
    if (role === "PARTNER") {
      return { label: "View Workshop Profile", href: "/partner/profile" };
    }
  }

  // 6. Website Leads & Callbacks
  if (titleLower.includes("website lead") || titleLower.includes("callback") || titleLower.includes("lead")) {
    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      return { label: "View Marketing Leads", href: "/admin/marketing/leads" };
    }
    if (role === "EXECUTIVE") {
      return { label: "View Website Leads", href: "/executive/website-leads" };
    }
  }

  // 7. Warranties
  if (payload.warrantyId || titleLower.includes("warranty") || msgLower.includes("warranty")) {
    if (role === "CUSTOMER") return { label: "View Warranties", href: payload.warrantyId ? `/customer/warranty/${payload.warrantyId}` : "/customer/warranty" };
    if (role === "SUPER_ADMIN" || role === "ADMIN") return { label: "View Admin Dashboard", href: "/admin/dashboard" };
    if (role === "EXECUTIVE") return { label: "View Warranties", href: "/executive/warranties" };
  }

  // 8. Settlements / Payouts / Payments
  if (
    payload.settlementId ||
    titleLower.includes("payment") ||
    msgLower.includes("payment") ||
    titleLower.includes("payout") ||
    msgLower.includes("payout") ||
    titleLower.includes("settlement") ||
    msgLower.includes("settlement") ||
    titleLower.includes("refund") ||
    msgLower.includes("refund")
  ) {
    if (role === "ACCOUNTS") return { label: "View Settlements", href: "/accounts/settlements" };
    if (role === "PARTNER") return { label: "View My Wallet", href: "/partner/wallet" };
    if (role === "SUPER_ADMIN" || role === "ADMIN") return { label: "View Finance Settlements", href: "/admin/finance/settlements" };
    if (role === "CUSTOMER") return { label: "View Payments", href: "/customer/payments" };
  }

  // 9. Users / Staff Management
  if (payload.userId || titleLower.includes("user") || msgLower.includes("user") || titleLower.includes("staff") || msgLower.includes("staff")) {
    if (role === "SUPER_ADMIN" || role === "ADMIN") return { label: "Manage Users", href: "/admin/users" };
    if (role === "PARTNER") return { label: "Manage Staff", href: "/partner/staff" };
  }

  // Fallback defaults
  if (role === "CUSTOMER") return { label: "View Dashboard", href: "/customer/dashboard" };
  if (role === "PARTNER") return { label: "View Dashboard", href: "/partner/dashboard" };
  if (role === "ACCOUNTS") return { label: "View Accounts", href: "/accounts/dashboard" };
  if (role === "SUPER_ADMIN" || role === "ADMIN") return { label: "View Notifications", href: "/admin/notifications" };
  if (role === "EXECUTIVE") return { label: "View Notifications", href: "/executive/notifications" };
  return { label: "View Dashboard", href: "/admin/dashboard" };
};

export function NotificationDetailsModal({
  notification,
  onClose,
  userRole = "SUPER_ADMIN"
}: NotificationDetailsModalProps) {
  if (!notification) return null;

  const payload = notification.data || notification.payload || {};
  const category = notification.category || notification.type || "SYSTEM";
  const actionLink = getNotificationTargetLink(notification, userRole);

  const getCategoryIcon = () => {
    switch (category) {
      case "SYSTEM":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "BID_RECEIVED":
      case "NEW_BID":
        return <Zap className="w-5 h-5 text-amber-500" />;
      case "BOOKING_UPDATE":
      case "JOB_STATUS":
        return <CalendarClock className="w-5 h-5 text-primary-navy" />;
      case "PAYMENT":
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary-orange" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-lg shadow-2xl overflow-hidden bg-white border-gray-100 flex flex-col">
        <CardHeader className="border-b border-gray-100 bg-gray-50/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 shrink-0">
                {getCategoryIcon()}
              </div>
              <div>
                <CardTitle className="text-base font-bold text-gray-900 font-heading">
                  Notification Details
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                    {category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {notification.createdAt ? format(new Date(notification.createdAt), "PPP p") : "Recently"}
                  </span>
                </CardDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* Main Title & Message */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-gray-900 leading-snug">
              {notification.title}
            </h3>
            <div className="bg-gray-50 border border-gray-200/80 p-4 rounded-xl text-sm text-gray-700 font-medium leading-relaxed">
              {notification.message}
            </div>
          </div>

          {/* Payload Data Breakdown */}
          {Object.keys(payload).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-primary-orange" /> Associated Metadata
              </h4>
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3.5 grid grid-cols-2 gap-3 text-xs">
                {payload.partnerName && (
                  <div>
                    <span className="text-gray-500 font-bold text-[10px] uppercase block">Partner</span>
                    <span className="font-black text-gray-900 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" /> {payload.partnerName}
                    </span>
                  </div>
                )}

                {payload.amount && (
                  <div>
                    <span className="text-gray-500 font-bold text-[10px] uppercase block">Amount</span>
                    <span className="font-black text-emerald-600 text-sm mt-0.5 block">
                      ₹{payload.amount}
                    </span>
                  </div>
                )}

                {payload.bookingReference && (
                  <div>
                    <span className="text-gray-500 font-bold text-[10px] uppercase block">Booking Ref</span>
                    <span className="font-mono font-bold text-gray-800 text-[11px] truncate block mt-0.5">
                      #{payload.bookingReference}
                    </span>
                  </div>
                )}

                {payload.verifiedAt && (
                  <div>
                    <span className="text-gray-500 font-bold text-[10px] uppercase block">Verified At</span>
                    <span className="font-semibold text-gray-900 text-xs mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {new Date(payload.verifiedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {(payload.displayStatus || payload.status) && (
                  <div>
                    <span className="text-gray-500 font-bold text-[10px] uppercase block">Job Status</span>
                    <span className="font-extrabold text-purple-700 text-xs mt-0.5 block">
                      {payload.displayStatus || payload.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose} className="text-xs font-bold text-gray-600">
            Close
          </Button>

          {actionLink && (
            <Button asChild className="bg-primary-navy hover:bg-navy-900 text-white font-bold text-xs shadow-md">
              <Link href={actionLink.href} onClick={onClose} className="flex items-center gap-1.5">
                {actionLink.label} <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
