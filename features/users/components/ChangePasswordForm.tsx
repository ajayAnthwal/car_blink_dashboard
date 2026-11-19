"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { changePassword } from "@/lib/services";
import { useUserProfile } from "@/features/customer/hooks/useCustomerQueries";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Key, Eye, EyeOff, Info, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  });

const setPasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  });

type PasswordFormValues = {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
};

interface ChangePasswordFormProps {
  hasCustomPassword?: boolean;
}

export function ChangePasswordForm({ hasCustomPassword: propHasCustomPassword }: ChangePasswordFormProps = {}) {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // If prop is passed, prefer it; otherwise check profile; default to true if undefined
  const hasCustomPassword =
    propHasCustomPassword !== undefined
      ? propHasCustomPassword
      : profile?.hasCustomPassword !== undefined
      ? profile.hasCustomPassword
      : true;

  const activeSchema = hasCustomPassword ? changePasswordSchema : setPasswordSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(activeSchema as any),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Re-sync form reset if hasCustomPassword state updates
  useEffect(() => {
    reset({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  }, [hasCustomPassword, reset]);

  const onSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await changePassword({
        currentPassword: hasCustomPassword ? (data.currentPassword || "") : "",
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      });

      const successText = hasCustomPassword
        ? "Password changed successfully!"
        : "Password set successfully! You can now log in with your password.";
      
      setMessage({ type: "success", text: successText });
      toast.success(successText);
      reset();

      // Refetch profile so hasCustomPassword flips to true immediately
      await queryClient.invalidateQueries({ queryKey: ["customer", "profile"] });
      await queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    } catch (error: any) {
      const errorMsg = error?.message || (hasCustomPassword ? "Failed to change password." : "Failed to set password.");
      setMessage({ type: "error", text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isProfileLoading && propHasCustomPassword === undefined) {
    return (
      <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-neutral-muted/20 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary-navy/5 to-transparent border-b border-neutral-muted/10 p-6">
          <Skeleton className="h-6 w-48 bg-slate-200" />
        </CardHeader>
        <CardContent className="p-6 space-y-4 max-w-md">
          <Skeleton className="h-10 w-full bg-slate-100" />
          <Skeleton className="h-10 w-full bg-slate-100" />
          <Skeleton className="h-10 w-28 bg-slate-200" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-neutral-muted/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary-navy/5 to-transparent border-b border-neutral-muted/10">
        <CardTitle className="flex items-center space-x-2 text-primary-navy">
          {hasCustomPassword ? (
            <Lock className="w-5 h-5 text-primary-orange" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-secondary-blue" />
          )}
          <span>{hasCustomPassword ? "Change Password" : "Set Account Password"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
          {!hasCustomPassword && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800 font-medium leading-relaxed">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>You signed in using mobile OTP. Create a password to enable password login.</span>
            </div>
          )}

          {message.text && (
            <div
              className={`p-4 rounded-xl text-sm font-medium border flex items-center space-x-2 ${
                message.type === "success"
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-danger/10 text-danger border-danger/20"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Current Password - Only required & shown when a custom password exists */}
          {hasCustomPassword && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  {...register("currentPassword")}
                  required={hasCustomPassword}
                  className="bg-neutral-white border-neutral-muted/40 focus:border-primary-orange pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>
              )}
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5">
              <Key className="w-4 h-4 text-neutral-muted" /> New Password
            </label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                {...register("newPassword")}
                required
                className="bg-neutral-white border-neutral-muted/40 focus:border-primary-orange pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5">
              <Key className="w-4 h-4 text-neutral-muted" /> Confirm New Password
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                {...register("confirmNewPassword")}
                required
                className="bg-neutral-white border-neutral-muted/40 focus:border-primary-orange pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmNewPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" isLoading={isLoading}>
              {hasCustomPassword ? "Update Password" : "Set Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
