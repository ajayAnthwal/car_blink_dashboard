// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { useUpdateSecurityPinMutation } from "@/features/accounts/hooks/useAccountsQueries";

export function SecurityPinForm() {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const updatePinMutation = useUpdateSecurityPinMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!newPin || newPin.length < 4) {
      setMessage({ type: "error", text: "Security PIN must be at least 4 digits." });
      return;
    }

    if (newPin !== confirmPin) {
      setMessage({ type: "error", text: "New PIN and Confirm PIN do not match." });
      return;
    }

    try {
      await updatePinMutation.mutateAsync({ newPin });
      setMessage({ type: "success", text: "Security PIN updated successfully!" });
      setNewPin("");
      setConfirmPin("");
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to update Security PIN." });
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-xl font-heading text-gray-900">
          <div className="bg-orange-50 p-2.5 rounded-2xl text-primary-orange">
            <KeyRound className="w-5 h-5" />
          </div>
          <span>Accounts Security PIN</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          Set your personal 4-digit Security PIN for approving refunds and partner settlements.
        </p>

        {message.text && (
          <div className={`p-3.5 rounded-xl text-sm font-medium mb-4 border ${
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
              label="New 4-Digit PIN"
              type="password"
              maxLength={6}
              placeholder="e.g. 4321"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              required
            />
            <Input
              label="Confirm 4-Digit PIN"
              type="password"
              maxLength={6}
              placeholder="e.g. 4321"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={updatePinMutation.isPending} className="bg-primary-navy hover:bg-primary-navy/90 text-white font-bold">
              Update Security PIN
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
