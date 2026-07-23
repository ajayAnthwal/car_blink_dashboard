"use client";

import React, { useState } from "react";
import { onboardVendor } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Store } from "lucide-react";

export default function VendorsPage() {
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    address: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await onboardVendor(formData);
      setMessage({ type: "success", text: "Vendor onboarded successfully." });
      setFormData({ name: "", contactPerson: "", phone: "", address: "" });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to onboard vendor." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary-navy flex items-center">
          <Store className="w-6 h-6 mr-2 text-primary-orange" />
          Vendor Management
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboard New Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          {message.text && (
            <div className={`p-3 rounded-lg text-sm border mb-4 ${
              message.type === "success" 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-danger/10 text-danger border-danger/20"
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vendor/Company Name"
                name="name"
                placeholder="e.g. AutoParts Pro"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Contact Person"
                name="contactPerson"
                placeholder="e.g. Jane Doe"
                value={formData.contactPerson}
                onChange={handleChange}
                required
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <Input
                label="Complete Address"
                name="address"
                placeholder="e.g. 123 Market St, City"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="pt-2">
              <Button type="submit" isLoading={isLoading} className="bg-primary-navy text-white hover:bg-primary-navy-light w-full md:w-auto">
                Onboard Vendor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
