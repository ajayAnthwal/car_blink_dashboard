"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { setApiAccessToken, setTokenRefreshProvider, setLogoutCallback } from "@/lib/axios";
import { ROLE_ROUTES, Role } from "@/lib/constants";
import { logoutUser, refreshToken, getCurrentUserProfile } from "@/lib/services";
import { setSessionCookie, clearSessionCookie } from "@/app/actions/auth";

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
    try {
      await logoutUser();
      await clearSessionCookie();
    } catch (error) {
      console.error("Logout failed", error);
    }

    setUser(null);
    setAccessToken(null);
    setApiAccessToken(null);
    router.push("/login");
  };

  const handleLogin = async (newUser: User, newAccessToken: string, newRefreshToken: string) => {
    setUser(newUser);
    setAccessToken(newAccessToken);
    setApiAccessToken(newAccessToken);
    await setSessionCookie(newAccessToken);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Attempt to get a new access token using HttpOnly cookies
        const refreshData = await refreshToken({});
        if (refreshData?.accessToken) {
          const newAccessToken = refreshData.accessToken;
          setApiAccessToken(newAccessToken);
          
          // Hydrate user profile
          const userProfile = await getCurrentUserProfile();
          await handleLogin(userProfile, newAccessToken, "");
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to restore session", error);
        // Clear any stray state if incomplete
        setUser(null);
        setAccessToken(null);
        setApiAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Setup API client callbacks for Axios interceptors
    setLogoutCallback(handleLogout);
    setTokenRefreshProvider(async () => {
      try {
        const refreshData = await refreshToken({});
        const newAccessToken = refreshData.accessToken;

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
