"use client";

import React, { useState, useEffect } from "react";
import { getCustomerStatus } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/Card";
import { Users, Loader2, Phone, Mail, Clock, CheckCircle } from "lucide-react";

export default function CustomerStatusPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await getCustomerStatus(1, 50);
      setCustomers(res?.docs || res || []);
    } catch (err) {
      console.error("Failed to load customer status", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE": return "bg-success/10 text-success border-success/20";
      case "INACTIVE": return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
      case "SUSPENDED": return "bg-danger/10 text-danger border-danger/20";
      default: return "bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-primary-navy flex items-center">
          <Users className="w-6 h-6 mr-2 text-primary-orange" /> 
          Customer Status Overview
        </h2>
        <p className="text-neutral-muted text-sm mt-1">Track and manage the current status of all registered customers.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-10 bg-neutral-white rounded-2xl shadow-sm border border-neutral-muted/20">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <Users className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
          <p className="text-neutral-muted">No customers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <Card key={customer._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-primary-navy/5 rounded-full flex items-center justify-center text-primary-navy font-bold">
                    {customer.fullName?.charAt(0).toUpperCase() || "C"}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(customer.status)}`}>
                    {customer.status || "UNKNOWN"}
                  </span>
                </div>
                
                <h3 className="font-bold text-primary-navy truncate">{customer.fullName}</h3>
                
                <div className="mt-3 space-y-2 text-sm text-neutral-muted">
                  <p className="flex items-center truncate">
                    <Mail className="w-3.5 h-3.5 mr-2 shrink-0" /> {customer.email}
                  </p>
                  <p className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-2 shrink-0" /> {customer.phone}
                  </p>
                  <p className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-2 shrink-0" /> Joined {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-muted/10 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-neutral-bg p-2 rounded">
                    <span className="block text-primary-navy font-bold">{customer.totalBookings || 0}</span>
                    <span className="text-neutral-muted">Bookings</span>
                  </div>
                  <div className="bg-neutral-bg p-2 rounded">
                    <span className="block text-primary-navy font-bold flex items-center justify-center">
                      {customer.isVerified ? <CheckCircle className="w-3 h-3 text-success mr-1" /> : ""}
                      {customer.isVerified ? "Yes" : "No"}
                    </span>
                    <span className="text-neutral-muted">Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
