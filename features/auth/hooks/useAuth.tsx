"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { setApiAccessToken, setTokenRefreshProvider, setLogoutCallback } from "@/lib/axios";
import { ROLE_ROUTES, Role } from "@/lib/constants";
import { logoutUser, refreshToken, getCurrentUserProfile } from "@/lib/services";

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
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    // Call the backend logout if we have a token
    if (accessToken || localStorage.getItem("refreshToken")) {
      try {
        await logoutUser();
      } catch (e) {
        // Ignore API errors on logout
      }
    }

    setUser(null);
    setAccessToken(null);
    setApiAccessToken(null);
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    Cookies.remove("isLoggedIn");
    Cookies.remove("userRole");
    Cookies.remove("accessToken");
    router.push("/login");
  };

  const handleLogin = (newUser: User, newAccessToken: string, newRefreshToken: string) => {
    setUser(newUser);
    setAccessToken(newAccessToken);
    setApiAccessToken(newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    Cookies.set("isLoggedIn", "true", { path: "/" });
    Cookies.set("userRole", newUser.role, { path: "/" });
    Cookies.set("accessToken", newAccessToken, { path: "/" });
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedRefreshToken = localStorage.getItem("refreshToken");

        if (storedRefreshToken) {
          // 1. Get a new access token
          const refreshData = await refreshToken({ refreshToken: storedRefreshToken });
          const newAccessToken = refreshData.accessToken;
          const newRefreshToken = refreshData.refreshToken || storedRefreshToken;

          // Temporarily set it so the /me request has auth
          setApiAccessToken(newAccessToken);

          // 2. Hydrate accurate user profile directly from backend
          const userProfile = await getCurrentUserProfile();

          handleLogin(userProfile, newAccessToken, newRefreshToken);
        } else {
          // No token found, just finish loading
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to restore session", error);
        // Clear any stray state if incomplete
        setUser(null);
        setAccessToken(null);
        setApiAccessToken(null);
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        Cookies.remove("isLoggedIn");
        Cookies.remove("userRole");
        Cookies.remove("accessToken");
      } finally {
        setIsLoading(false);
      }
    };

    // Setup API client callbacks for Axios interceptors
    setLogoutCallback(handleLogout);
    setTokenRefreshProvider(async () => {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) return null;

      try {
        const refreshData = await refreshToken({ refreshToken: storedRefreshToken });
        const newAccessToken = refreshData.accessToken;

        if (refreshData.refreshToken) {
          localStorage.setItem("refreshToken", refreshData.refreshToken);
        }

        setAccessToken(newAccessToken);
        return newAccessToken;
      } catch (error) {
        return null;
      }
    });

    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, isAuthenticated: !!user, login: handleLogin, logout: handleLogout }}>
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
