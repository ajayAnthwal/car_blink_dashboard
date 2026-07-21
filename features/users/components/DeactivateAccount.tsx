"use client";

import React, { useState } from "react";
import { deactivateAccount } from "@/lib/services";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export function DeactivateAccount() {
  const { logout } = useAuth();
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeactivate = async () => {
    setIsLoading(true);
    setError("");

    try {
      await deactivateAccount();
      // On success, force logout and redirect
      await logout();
    } catch (err: any) {
      setError(err?.message || "Failed to deactivate account.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-danger/20">
      <CardHeader>
        <CardTitle className="text-danger">Danger Zone</CardTitle>
        <CardDescription>
          Deactivating your account will hide your profile and active listings. This action is reversible by contacting support.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg border border-danger/20 mb-4">
            {error}
          </div>
        )}

        {!isConfirming ? (
          <Button 
            type="button" 
            onClick={() => setIsConfirming(true)}
            className="bg-danger hover:bg-danger/90 focus:ring-danger"
          >
            Deactivate Account
          </Button>
        ) : (
          <div className="space-y-4 bg-danger/5 p-4 rounded-lg border border-danger/20">
            <p className="text-sm font-medium text-danger">
              Are you absolutely sure you want to deactivate your account?
            </p>
            <div className="flex space-x-3">
              <Button 
                type="button" 
                onClick={handleDeactivate} 
                isLoading={isLoading}
                className="bg-danger hover:bg-danger/90 focus:ring-danger"
              >
                Yes, Deactivate
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsConfirming(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
