"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CarBlink Customer Portal caught runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-red-100">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 font-heading">
            Something Went Wrong
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            An unexpected error occurred while loading this page. You can try refreshing the page or return to your dashboard.
          </p>
          {process.env.NODE_ENV !== "production" && error?.message && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl font-mono mt-2 break-all text-left">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-primary-orange hover:bg-orange-600 text-white font-bold rounded-xl py-5 shadow-md flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl py-5 shadow-xs"
          >
            <Link href="/customer/dashboard" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Dashboard
            </Link>
          </Button>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <Link
            href="/customer/support"
            className="text-xs font-semibold text-primary-navy hover:underline inline-flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Need assistance? Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
