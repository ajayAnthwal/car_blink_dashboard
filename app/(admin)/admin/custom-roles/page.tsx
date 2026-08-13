// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useAdminCustomRoleMutation } from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Shield, CheckCircle2 } from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  "VIEW_USERS",
  "MANAGE_USERS",
  "VIEW_FINANCE",
  "MANAGE_FINANCE",
  "MANAGE_PROMOTIONS",
  "VIEW_REPORTS",
  "MANAGE_SETTINGS",
  "MANAGE_PARTNERS",
  "MANAGE_INVENTORY",
];

export default function CustomRolesPage() {
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  const customRoleMutation = useAdminCustomRoleMutation();

  const handleTogglePermission = (perm: string) => {
    setSelectedPermissions(prev => 
      prev.includes(perm) 
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName || selectedPermissions.length === 0) return;

    setMessage({ type: "", text: "" });

    try {
      await customRoleMutation.mutateAsync({ roleName, permissions: selectedPermissions });
      setMessage({ type: "success", text: "Custom role created successfully!" });
      setRoleName("");
      setSelectedPermissions([]);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to create custom role." });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-primary-navy flex items-center">
          <Settings className="w-6 h-6 mr-2 text-primary-orange" /> 
          Custom Roles Management
        </h2>
        <p className="text-neutral-muted text-sm mt-1">Create specific roles with granular permissions for your staff.</p>
      </div>

      <Card className="shadow-subtle border-none">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary-navy" /> Create New Role
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {message.text && (
            <div className={`p-3 mb-6 rounded-lg text-sm border font-medium flex items-center gap-2 ${
              message.type === "success" 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {message.type === "success" && <CheckCircle2 className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="max-w-md">
              <Input
                label="Role Name"
                placeholder="e.g. Finance Analyst"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-primary-navy mb-4">Select Permissions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label 
                    key={perm} 
                    className={`flex items-start space-x-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      selectedPermissions.includes(perm) 
                        ? 'border-primary-orange bg-orange-50/30 shadow-sm' 
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm)}
                        onChange={() => handleTogglePermission(perm)}
                        className="w-4 h-4 rounded text-primary-orange focus:ring-primary-orange border-gray-300"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{perm.replace(/_/g, " ")}</span>
                      <span className="text-xs text-gray-500 mt-0.5 font-medium">Access to {perm.toLowerCase().replace(/_/g, " ")}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Button type="submit" isLoading={customRoleMutation.isPending} disabled={!roleName || selectedPermissions.length === 0} className="bg-primary-navy hover:bg-primary-navy-light px-8">
                Save Role
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
