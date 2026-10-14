// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "301860554171-jcpr05vbq00aevnqmnm2fgg7nlu43jqk.apps.googleusercontent.com";

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
  const auth = useAuth();
  const tokenClientRef = useRef<any>(null);

  // Helper to ensure Google Identity Services script is loaded
  const loadGoogleScript = (): Promise<any> => {
    if (typeof window === "undefined") return Promise.resolve(null);
    if ((window as any).google?.accounts?.oauth2) {
      return Promise.resolve((window as any).google);
    }
    return new Promise((resolve) => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        if ((window as any).google?.accounts?.oauth2) {
          return resolve((window as any).google);
        }
        existing.addEventListener("load", () => resolve((window as any).google));
        existing.addEventListener("error", () => resolve(null));
        setTimeout(() => resolve((window as any).google || null), 2500);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve((window as any).google);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    let isMounted = true;
    loadGoogleScript().then((google) => {
      if (!isMounted || !google?.accounts) return;

      // Initialize Google One Tap if available
      try {
        if (google.accounts.id) {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (credentialResponse: any) => {
              if (credentialResponse?.credential) {
                handleBackendAuth({ idToken: credentialResponse.credential, role });
              }
            },
          });
        }
      } catch (err) {
        console.warn("Google One Tap initialization notice:", err);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [role]);

  const handleBackendAuth = async (payload: { idToken?: string; googleUser?: any; role: string }) => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.carblink.in/api";
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
        const isProd = window.location.hostname.endsWith("carblink.in");
        const cookieDomain = isProd ? "; domain=.carblink.in" : "";
        const expires = new Date(Date.now() + 30 * 864e5).toUTCString();

        window.localStorage.setItem("car_blink_access_token", tokens.accessToken);
        window.localStorage.setItem("carBlink_token", tokens.accessToken);
        if (tokens.refreshToken) {
          window.localStorage.setItem("car_blink_refresh_token", tokens.refreshToken);
        }

        document.cookie = `car_blink_access_token=${encodeURIComponent(tokens.accessToken)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
        document.cookie = `accessToken=${encodeURIComponent(tokens.accessToken)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
        document.cookie = `role=${encodeURIComponent(userRole)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;
        document.cookie = `user_role=${encodeURIComponent(userRole)}; path=/; expires=${expires}; SameSite=Lax${cookieDomain}`;

        try {
          if (auth?.login) {
            await auth.login(user, tokens.accessToken, tokens.refreshToken || tokens.accessToken);
          }
        } catch (e) {
          console.warn("Auth context update note:", e);
        }
      }

      if (onSuccess) {
        onSuccess(res);
      }

      if (typeof window !== "undefined") {
        const roleRoutes: Record<string, string> = {
          CUSTOMER: "/customer/dashboard",
          PARTNER: "/partner/dashboard",
          EXECUTIVE: "/executive/dashboard",
          ACCOUNTS: "/accounts/dashboard",
          SUPER_ADMIN: "/admin/dashboard",
          ADMIN: "/admin/dashboard",
          STAFF: "/admin/dashboard",
        };
        const targetRoute = roleRoutes[userRole] || "/customer/dashboard";
        window.location.href = targetRoute;
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to authenticate with Google");
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    setIsLoading(true);
    const google = await loadGoogleScript();

    if (!google?.accounts) {
      setIsLoading(false);
      toast.error("Google Authentication service could not be loaded. Please check your network or try again.");
      return;
    }

    // Modern Google Identity Services OAuth 2.0 Token Client (Opens official Google Account Selector popup)
    if (google.accounts.oauth2) {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setIsLoading(false);
              if (tokenResponse.error !== "popup_closed_by_user") {
                toast.error("Google sign-in was cancelled or encountered an error.");
              }
              return;
            }

            if (tokenResponse?.access_token) {
              try {
                // Fetch verified profile directly from Google
                const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (!profileRes.ok) {
                  throw new Error("Could not retrieve Google profile details.");
                }
                const googleUser = await profileRes.json();
                await handleBackendAuth({ googleUser, role });
              } catch (err: any) {
                setIsLoading(false);
                toast.error(err.message || "Failed to fetch Google profile info");
              }
            } else {
              setIsLoading(false);
            }
          },
          error_callback: (err: any) => {
            setIsLoading(false);
            console.error("Google popup error:", err);
            toast.error("Google sign-in popup was blocked. Please allow popups for this site.");
          },
        });

        tokenClientRef.current = tokenClient;
        tokenClient.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (err) {
        console.error("Token client error:", err);
      }
    }

    // Fallback: If oauth2 is unavailable, trigger Google One Tap
    if (google.accounts.id) {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsLoading(false);
          toast.error("Google sign-in prompt was closed or not displayed. Please try again.");
        }
      });
      return;
    }

    setIsLoading(false);
    toast.error("Google sign-in is initializing. Please click again.");
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
      <span>{isLoading ? "Signing in with Google..." : text}</span>
    </button>
  );
}

export default GoogleButton;
