"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getUserProfile, updateUserProfile } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/FileUpload";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ProfileForm() {
  const { user, login, accessToken } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: "",
    profileImage: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      // In a real scenario, we might have profileImage in the hydrated user context too,
      // but let's fetch the absolute latest if needed, or just use what we have.
      setFormData({
        fullName: user.fullName || "",
        profileImage: (user as any).profileImage || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const responseData = await updateUserProfile(formData);
      // Update local context
      const newRefreshToken = localStorage.getItem("refreshToken") || "";
      login(responseData.data, accessToken || "", newRefreshToken);
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Failed to update profile." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message.text && (
            <div className={`p-3 rounded-lg text-sm border ${
              message.type === "success" 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-danger/10 text-danger border-danger/20"
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              name="email"
              value={user?.email || ""}
              readOnly
              className="bg-neutral-bg text-neutral-muted"
            />
            <Input
              label="Phone"
              name="phone"
              value={user?.phone || ""}
              readOnly
              className="bg-neutral-bg text-neutral-muted"
            />
          </div>

          <div className="max-w-xs">
            <FileUpload
              label="Profile Image"
              folder="profile"
              currentValue={formData.profileImage}
              onUploadSuccess={(url) => setFormData(prev => ({ ...prev, profileImage: url }))}
              onUploadError={(err) => setMessage({ type: "error", text: err })}
            />
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" isLoading={isLoading}>Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
