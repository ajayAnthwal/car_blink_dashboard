"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { setApiAccessToken, setTokenRefreshProvider, setLogoutCallback } from "@/lib/axios";
import { ROLE_ROUTES, Role } from "@/lib/constants";
import { logoutUser, refreshToken, getCurrentUserProfile } from "@/lib/services";
import { setSessionCookie } from "@/app/actions/auth";
import { sanitizeSession } from "@/lib/auth-sanitizer";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = async (force: boolean = false) => {
    if (!force) {
      try {
        await logoutUser();
      } catch (error) {
        console.error("Logout API call error:", error);
      }
    }

    // Thorough Session Sanitization
    await sanitizeSession(queryClient);

    setUser(null);
    setAccessToken(null);

    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

  const refreshUser = async () => {
    if (!accessToken) return;
    try {
      const userProfile = await getCurrentUserProfile();
      setUser(userProfile);
    } catch (error) {
      console.error("Failed to refresh user profile", error);
    }
  };

  const handleLogin = async (newUser: User, newAccessToken: string, newRefreshToken: string) => {
    // 1. Sanitize any existing session state or tokens first
    await sanitizeSession(queryClient);

    // 2. Hydrate new session tokens
    setAccessToken(newAccessToken);
    setApiAccessToken(newAccessToken);
    setUser(newUser);

    if (newRefreshToken) {
      localStorage.setItem("car_blink_refresh_token", newRefreshToken);
    }
    
    // Store in cookie for server-side verification
    Cookies.set("role", newUser.role, { path: "/", expires: 7 });
    await setSessionCookie(newAccessToken);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedRefreshToken = localStorage.getItem("car_blink_refresh_token") || "";
        if (!storedRefreshToken) {
          setIsLoading(false);
          return;
        }

        const refreshData = await refreshToken({ refreshToken: storedRefreshToken });
        if (refreshData?.accessToken) {
          const newAccessToken = refreshData.accessToken;
          setApiAccessToken(newAccessToken);
          
          // Hydrate fresh user profile from backend with active token
          const userProfile = await getCurrentUserProfile();
          setUser(userProfile);
          setAccessToken(newAccessToken);
          Cookies.set("role", userProfile.role, { path: "/", expires: 7 });
          await setSessionCookie(newAccessToken);
        } else {
          await sanitizeSession(queryClient);
        }
      } catch (error) {
        console.error("Failed to restore session", error);
        await sanitizeSession(queryClient);
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    setLogoutCallback(handleLogout);
    setTokenRefreshProvider(async () => {
      try {
        const storedRefreshToken = localStorage.getItem("car_blink_refresh_token") || "";
        if (!storedRefreshToken) return null;
        const refreshData = await refreshToken({ refreshToken: storedRefreshToken });
        const newAccessToken = refreshData.accessToken;
        
        if (refreshData.refreshToken) {
          localStorage.setItem("car_blink_refresh_token", refreshData.refreshToken);
        }

        setAccessToken(newAccessToken);
        return newAccessToken;
      } catch (error) {
        return null;
      }
    });

    const onFocus = () => {
      if (localStorage.getItem("car_blink_refresh_token")) {
        refreshUser();
      }
    };
    window.addEventListener("focus", onFocus);

    initAuth();

    return () => {
      setLogoutCallback(() => {});
      setTokenRefreshProvider(null as any);
      window.removeEventListener("focus", onFocus);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, isAuthenticated: !!user, login: handleLogin, logout: handleLogout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
