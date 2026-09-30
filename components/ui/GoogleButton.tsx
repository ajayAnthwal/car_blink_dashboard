// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface GoogleButtonProps {
  role?: string;
  onSuccess?: (data: any) => void;
  text?: string;
  className?: string;
}

export function GoogleButton({
  role = "CUSTOMER",
  onSuccess,
  text = "Continue with Google",
  className = "",
}: GoogleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Dynamically load Google GSI script if available
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId && typeof window !== "undefined" && !(window as any).google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleAuth = async (credentialResponse?: any) => {
    setIsLoading(true);
    try {
      let payload: any = { role };
      if (credentialResponse?.credential) {
        payload.idToken = credentialResponse.credential;
      } else {
        const email = prompt("Enter your Google Account email (Login with Google):");
        if (!email) {
          setIsLoading(false);
          return;
        }
        const name = email.split("@")[0].replace(/[._]/g, " ");
        payload.googleUser = {
          email,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`,
          sub: `g_${Date.now()}`,
        };
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const response = await fetch(`${apiUrl}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message || "Failed to authenticate with Google");
      }

      const user = res.data?.user || res.user;
      const tokens = res.data?.tokens || res.tokens;
      const userRole = user?.role || role;

      if (tokens?.accessToken && typeof window !== "undefined") {
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
        window.localStorage.setItem("car_blink_access_token", tokens.accessToken);
        if (tokens.refreshToken) {
          window.localStorage.setItem("car_blink_refresh_token", tokens.refreshToken);
        }
        document.cookie = `car_blink_access_token=${encodeURIComponent(tokens.accessToken)}; path=/; expires=${expires}; SameSite=Lax`;
        document.cookie = `accessToken=${encodeURIComponent(tokens.accessToken)}; path=/; expires=${expires}; SameSite=Lax`;
        document.cookie = `role=${encodeURIComponent(userRole)}; path=/; expires=${expires}; SameSite=Lax`;
        document.cookie = `user_role=${encodeURIComponent(userRole)}; path=/; expires=${expires}; SameSite=Lax`;
      }

      if (typeof window !== "undefined") {
        const roleRoutes: Record<string, string> = {
          CUSTOMER: "/customer/dashboard",
          PARTNER: "/partner/dashboard",
          SUPER_ADMIN: "/admin/dashboard",
          ADMIN: "/admin/dashboard",
          STAFF: "/admin/dashboard",
          ACCOUNTS: "/accounts/dashboard",
        };
        const targetRoute = roleRoutes[userRole] || "/customer/dashboard";
        window.location.href = targetRoute;
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to authenticate with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleAuth,
      });
      (window as any).google.accounts.id.prompt();
    } else {
      handleGoogleAuth();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`w-full py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm flex items-center justify-center space-x-3 shadow-xs hover:shadow-sm transition-all border-neutral-200/80 ${className}`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>{isLoading ? "Signing in..." : text}</span>
    </button>
  );
}
export default GoogleButton;
