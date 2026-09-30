import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getDashboardForRole(role: string | null): string {
  if (!role) return "/login";
  const r = role.toUpperCase();
  switch (r) {
    case "CUSTOMER":
      return "/customer/dashboard";
    case "PARTNER":
      return "/partner/dashboard";
    case "EXECUTIVE":
      return "/executive/dashboard";
    case "ACCOUNTS":
      return "/accounts/dashboard";
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/login";
  }
}

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value || request.cookies.get("car_blink_access_token")?.value;
  let userRole: string | null = null;
  
  // 1. Cryptographically verified role from JWT token
  if (accessToken) {
    try {
      const payloadBase64 = accessToken.split('.')[1];
      if (payloadBase64) {
        let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const padLength = (4 - (base64.length % 4)) % 4;
        base64 += '='.repeat(padLength);
        const payloadString = atob(base64);
        const payload = JSON.parse(payloadString);
        if (payload && payload.role) {
          userRole = payload.role;
        }
      }
    } catch (error) {
      console.error("Failed to decode token in middleware", error);
    }
  }

  // 2. Cookie fallback if JWT payload parsing failed
  if (!userRole) {
    userRole = request.cookies.get("role")?.value || request.cookies.get("user_role")?.value || null;
  }

  const { pathname, searchParams } = request.nextUrl;

  // Handle SSO ?token= query parameter across any route
  const ssoToken = searchParams.get("token") || 
                   searchParams.get("accessToken") || 
                   searchParams.get("access_token") || 
                   searchParams.get("authToken") || 
                   searchParams.get("jwt") || 
                   searchParams.get("sso") || 
                   searchParams.get("t");

  if (ssoToken) {
    try {
      const payloadBase64 = ssoToken.split('.')[1];
      if (payloadBase64) {
        let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const padLength = (4 - (base64.length % 4)) % 4;
        base64 += '='.repeat(padLength);
        const payloadString = atob(base64);
        const payload = JSON.parse(payloadString);
        if (payload && payload.role) {
          const isProd = request.url.includes("carblink.in");
          const domain = isProd ? ".carblink.in" : undefined;
          
          let targetPath = pathname;
          if (targetPath === "/login" || targetPath === "/") {
            targetPath = getDashboardForRole(payload.role);
          }
          
          const cleanUrl = new URL(targetPath, request.url);
          searchParams.forEach((val, key) => {
            if (!["token", "accessToken", "access_token", "authToken", "jwt", "sso", "t"].includes(key)) {
              cleanUrl.searchParams.set(key, val);
            }
          });

          const response = NextResponse.redirect(cleanUrl);
          const cookieOpts = {
            path: "/",
            domain: domain,
            maxAge: 365 * 86400,
            sameSite: "lax" as const,
          };
          response.cookies.set("accessToken", ssoToken, cookieOpts);
          response.cookies.set("car_blink_access_token", ssoToken, cookieOpts);
          response.cookies.set("role", payload.role, cookieOpts);
          response.cookies.set("user_role", payload.role, cookieOpts);
          return response;
        }
      }
    } catch (err) {
      console.error("Middleware SSO token parse error", err);
    }

    if (pathname !== "/login") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("token", ssoToken);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (searchParams.get("switch") || searchParams.get("logout")) {
    return NextResponse.next();
  }

  const isLoggedIn = !!accessToken && !!userRole;
  const correctDashboard = getDashboardForRole(userRole);
  const normalizedRole = userRole ? userRole.toUpperCase() : "";

  // Strictly enforce role-specific route boundaries with zero leakage
  if (pathname.startsWith("/customer")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", request.url));
    if (normalizedRole !== "CUSTOMER") {
      return NextResponse.redirect(new URL(correctDashboard, request.url));
    }
  }
  
  if (pathname.startsWith("/partner")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", request.url));
    if (normalizedRole !== "PARTNER") {
      return NextResponse.redirect(new URL(correctDashboard, request.url));
    }
  }

  if (pathname.startsWith("/executive")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", request.url));
    if (normalizedRole !== "EXECUTIVE") {
      return NextResponse.redirect(new URL(correctDashboard, request.url));
    }
  }

  if (pathname.startsWith("/accounts")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", request.url));
    if (normalizedRole !== "ACCOUNTS") {
      return NextResponse.redirect(new URL(correctDashboard, request.url));
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/super-admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", request.url));
    if (normalizedRole !== "SUPER_ADMIN" && normalizedRole !== "ADMIN") {
      return NextResponse.redirect(new URL(correctDashboard, request.url));
    }
  }

  // Redirect authenticated users trying to access auth pages straight to their dashboard
  if (isLoggedIn && (pathname === "/login" || pathname === "/register" || pathname === "/verify-otp")) {
    return NextResponse.redirect(new URL(correctDashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/partner/:path*",
    "/admin/:path*",
    "/super-admin/:path*",
    "/executive/:path*",
    "/accounts/:path*",
    "/login",
    "/register",
    "/verify-otp",
  ],
};
