"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { changePassword } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lock, Key } from "lucide-react";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await changePassword(data);
      setMessage({ type: "success", text: "Password changed successfully!" });
      reset();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Failed to change password." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-neutral-muted/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary-navy/5 to-transparent border-b border-neutral-muted/10">
        <CardTitle className="flex items-center space-x-2 text-primary-navy">
          <Lock className="w-5 h-5 text-primary-orange" />
          <span>Change Password</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium border flex items-center space-x-2 ${
              message.type === "success" 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-danger/10 text-danger border-danger/20"
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5">Current Password</label>
            <Input
              type="password"
              {...register("currentPassword")}
              required
              className="bg-neutral-white border-neutral-muted/40 focus:border-primary-orange"
            />
            {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5"><Key className="w-4 h-4 text-neutral-muted" /> New Password</label>
            <Input
              type="password"
              {...register("newPassword")}
              required
              className="bg-neutral-white border-neutral-muted/40 focus:border-primary-orange"
            />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5"><Key className="w-4 h-4 text-neutral-muted" /> Confirm New Password</label>
            <Input
              type="password"
              {...register("confirmNewPassword")}
              required
              className="bg-neutral-white border-neutral-muted/40 focus:border-primary-orange"
            />
            {errors.confirmNewPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmNewPassword.message}</p>}
          </div>
          
          <div className="pt-2">
            <Button type="submit" isLoading={isLoading}>Update Password</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
