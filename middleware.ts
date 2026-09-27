import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value || request.cookies.get("car_blink_access_token")?.value;
  let userRole: string | null = null;
  
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

  if (!userRole) {
    userRole = request.cookies.get("role")?.value || request.cookies.get("user_role")?.value || null;
  }

  const { pathname, searchParams } = request.nextUrl;

  // Handle SSO ?token= query parameter (or aliases) across any route
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
            switch (payload.role) {
              case "CUSTOMER": targetPath = "/customer/dashboard"; break;
              case "PARTNER": targetPath = "/partner/dashboard"; break;
              case "EXECUTIVE": targetPath = "/executive/dashboard"; break;
              case "ACCOUNTS": targetPath = "/accounts/dashboard"; break;
              case "SUPER_ADMIN":
              case "ADMIN": targetPath = "/admin/dashboard"; break;
              default: targetPath = "/customer/dashboard"; break;
            }
          }
          
          const redirectUrl = new URL(targetPath, request.url);
          const response = NextResponse.redirect(redirectUrl);
          const cookieOpts = {
            path: "/",
            domain: domain,
            maxAge: 30 * 86400,
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
