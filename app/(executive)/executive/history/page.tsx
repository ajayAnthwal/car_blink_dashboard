"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Clock, Loader2, Search, Filter, MoreHorizontal, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { useExecutiveLeads } from "@/features/executive/hooks/useExecutiveQueries";

export default function ExecutiveHistoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const limit = 10;
  
  const queryStatus = statusFilter === "ALL" ? "COMPLETED,CANCELLED,ACCEPTED,DECLINED" : statusFilter;

  // React Query: Fetch Leads History
  const { 
    data: leadsData, 
    isLoading: isLeadsLoading, 
  } = useExecutiveLeads({ page, limit, search: debouncedSearch, status: queryStatus });
  
  const leads = leadsData?.leads || [];
  const total = leadsData?.total || 0;
  const totalPages = leadsData?.total ? Math.ceil(leadsData.total / limit) : 1;

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case "COMPLETED": return "bg-success/10 text-success border-success/20";
      case "CANCELLED": return "bg-danger/10 text-danger border-danger/20";
      case "ACCEPTED": return "bg-primary-orange/10 text-primary-orange border-primary-orange/20";
      case "DECLINED": return "bg-warning/10 text-warning-dark border-warning/20";
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-navy flex items-center">
            <Clock className="w-6 h-6 mr-2 text-primary-orange" />
            Lead History
          </h2>
          <p className="text-neutral-muted text-sm mt-1">
            Review past service requests, completed jobs, and cancelled bookings.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-8 h-10 w-full sm:w-auto border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-navy/20 cursor-pointer appearance-none min-w-[150px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DECLINED">Declined</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input 
              placeholder="Search leads..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-10 w-full"
            />
          </div>
        </div>
      </div>

      {isLeadsLoading ? (
        <div className="flex items-center justify-center p-20 bg-white rounded-2xl shadow-subtle border border-neutral-muted/20">
          <Loader2 className="w-10 h-10 text-primary-orange animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl shadow-subtle border border-neutral-muted/20 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium text-lg">
            No historical leads found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-subtle border border-neutral-muted/20 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="font-semibold text-primary-navy w-[60px] text-center">S.No</TableHead>
                  <TableHead className="font-semibold text-primary-navy">Customer</TableHead>
                  <TableHead className="font-semibold text-primary-navy">Service</TableHead>
                  <TableHead className="font-semibold text-primary-navy">Location & Date</TableHead>
                  <TableHead className="font-semibold text-primary-navy">Status</TableHead>
                  <TableHead className="font-semibold text-primary-navy text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead: any, index: number) => (
                  <TableRow key={lead._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Serial Number */}
                    <TableCell className="align-middle text-center font-medium text-gray-500">
                      {(page - 1) * limit + index + 1}
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="align-top">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-navy/5 rounded-full flex items-center justify-center text-primary-navy font-bold shrink-0">
                          {lead.customerId?.fullName?.charAt(0).toUpperCase() || "C"}
                        </div>
                        <div>
                          <div className="font-bold text-primary-navy">{lead.customerId?.fullName || "Unknown"}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{lead.customerId?.phone}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Service */}
                    <TableCell className="align-top">
                      <div className="flex flex-col space-y-1">
                        <span className="font-bold text-sm text-neutral-dark flex items-center gap-1.5">
                          {lead.serviceId?.name || "Service Request"}
                        </span>
                        <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                          {lead.vehicleId?.brand} {lead.vehicleId?.model}
                        </span>
                      </div>
                    </TableCell>

                    {/* Location & Date */}
                    <TableCell className="align-top">
                      <div className="flex flex-col space-y-1">
                        <div className="font-medium text-sm text-gray-900">
                          {lead.cityId?.name || "Unknown City"}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="align-top">
                       <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border ${getStatusBadgeColor(lead.status)}`}>
                         {lead.status}
                       </span>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="align-top text-right pr-4">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-primary-navy hover:bg-gray-100/80 rounded-full">
                             <MoreHorizontal className="h-5 w-5" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-40">
                           <DropdownMenuItem asChild className="cursor-pointer text-gray-700 font-medium">
                             <Link href={`/executive/leads/${lead._id}`} className="flex items-center w-full">
                               <Eye className="w-4 h-4 mr-2 text-gray-400" />
                               View Details
                             </Link>
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Showing page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
              <span className="text-gray-400 font-normal"> ({total} total leads)</span>
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white"
              >
                Previous
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || totalPages === 0}
                className="bg-white"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
