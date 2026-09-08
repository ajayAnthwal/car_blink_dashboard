// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useExecutivePayouts } from "@/features/accounts/hooks/useAccountsQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndianRupee, Loader2, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";

export default function AccountsPayoutsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useExecutivePayouts({ page, limit });
  const payouts = data?.payouts || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-heading">Executive Payouts & Commissions</h2>
        <p className="text-gray-500 text-sm mt-1">Manage monthly earnings and commissions for operations team executives</p>
      </div>

      <Card className="shadow-subtle border-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-xl">
            <IndianRupee className="w-5 h-5 text-primary-orange" />
            <span>Executive Commission Ledger</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">No executive payout records found.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Executive</th>
                  <th className="px-6 py-3.5 font-semibold">Phone / Contact</th>
                  <th className="px-6 py-3.5 font-semibold">Converted Leads</th>
                  <th className="px-6 py-3.5 font-semibold">Rate / Lead</th>
                  <th className="px-6 py-3.5 font-semibold">Total Commission</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((p: any) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {p.executive?.fullName || 'Executive User'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-600">
                      {p.executive?.phone || p.executive?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary-navy">
                      {p.leadsConverted} Leads
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                      ₹{p.commissionPerLead}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-600 text-md">
                      ₹{Number(p.totalEarnings || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                        {p.status || 'PROCESSED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-8 text-xs">
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 text-xs">
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
