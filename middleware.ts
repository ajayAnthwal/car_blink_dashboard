import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value || request.cookies.get("car_blink_access_token")?.value;
  let userRole = request.cookies.get("role")?.value || null;
  
  if (accessToken && !userRole) {
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

  const { pathname, searchParams } = request.nextUrl;

  // If SSO ?token= parameter is present in URL, DO NOT intercept on /login; let /login page execute SSO exchange!
  if (searchParams.get("token")) {
    return NextResponse.next();
  }

  const isLoggedIn = !!accessToken && !!userRole;

  // Protect role-specific routes
  if (pathname.startsWith("/customer") && (!isLoggedIn || userRole !== "CUSTOMER")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  if (pathname.startsWith("/partner") && (!isLoggedIn || userRole !== "PARTNER")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/executive") && (!isLoggedIn || userRole !== "EXECUTIVE")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/accounts") && (!isLoggedIn || userRole !== "ACCOUNTS")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname.startsWith("/admin") || pathname.startsWith("/super-admin")) && (!isLoggedIn || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged-in users away from auth pages to their respective dashboards
  if (isLoggedIn && (pathname === "/login" || pathname === "/register" || pathname === "/verify-otp")) {
    switch (userRole) {
      case "CUSTOMER": return NextResponse.redirect(new URL("/customer/dashboard", request.url));
      case "PARTNER": return NextResponse.redirect(new URL("/partner/dashboard", request.url));
      case "EXECUTIVE": return NextResponse.redirect(new URL("/executive/dashboard", request.url));
      case "ACCOUNTS": return NextResponse.redirect(new URL("/accounts/dashboard", request.url));
      case "SUPER_ADMIN":
      case "ADMIN": return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      default: return NextResponse.redirect(new URL("/login", request.url));
    }
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
