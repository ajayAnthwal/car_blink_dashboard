// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useCreateAdminCouponMutation } from "@/features/admin/hooks/useAdminQueries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Ticket } from "lucide-react";

export default function PromotionsPage() {
  const [formData, setFormData] = useState({
    code: "",
    discountPercentage: "",
    maxDiscountAmount: "",
    validUntil: "",
    usageLimit: ""
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const createCouponMutation = useCreateAdminCouponMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      await createCouponMutation.mutateAsync({
        code: formData.code.toUpperCase(),
        discountPercentage: Number(formData.discountPercentage),
        maxDiscountAmount: Number(formData.maxDiscountAmount),
        validUntil: new Date(formData.validUntil).toISOString(),
        usageLimit: Number(formData.usageLimit)
      });
      setMessage({ type: "success", text: "Coupon created successfully." });
      setFormData({ code: "", discountPercentage: "", maxDiscountAmount: "", validUntil: "", usageLimit: "" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to create coupon." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary-navy flex items-center">
          <Ticket className="w-6 h-6 mr-2 text-primary-orange" />
          Coupons & Promotions
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Coupon</CardTitle>
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
                label="Coupon Code"
                name="code"
                placeholder="e.g. FESTIVE50"
                value={formData.code}
                onChange={handleChange}
                required
              />
              <Input
                label="Discount Percentage (%)"
                name="discountPercentage"
                type="number"
                min="1"
                max="100"
                value={formData.discountPercentage}
                onChange={handleChange}
                required
              />
              <Input
                label="Max Discount Amount (₹)"
                name="maxDiscountAmount"
                type="number"
                min="1"
                value={formData.maxDiscountAmount}
                onChange={handleChange}
                required
              />
              <Input
                label="Usage Limit (Total uses)"
                name="usageLimit"
                type="number"
                min="1"
                value={formData.usageLimit}
                onChange={handleChange}
                required
              />
              <Input
                label="Valid Until"
                name="validUntil"
                type="datetime-local"
                value={formData.validUntil}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="pt-2">
              <Button type="submit" isLoading={createCouponMutation.isPending} className="bg-primary-navy text-white hover:bg-primary-navy-light w-full md:w-auto">
                Create Coupon
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
