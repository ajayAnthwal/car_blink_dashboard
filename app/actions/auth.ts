// @ts-nocheck
"use server";

import { cookies } from "next/headers";

export async function setSessionCookie(token: string, role?: string) {
  const isProd = process.env.NODE_ENV === "production";
  const domain = isProd ? ".carblink.in" : undefined;

  cookies().set("accessToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    ...(domain ? { domain } : {}),
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
  cookies().set("car_blink_access_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    ...(domain ? { domain } : {}),
    maxAge: 7 * 24 * 60 * 60,
  });

  if (role) {
    cookies().set("role", role, {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      ...(domain ? { domain } : {}),
      maxAge: 7 * 24 * 60 * 60,
    });
    cookies().set("user_role", role, {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      ...(domain ? { domain } : {}),
      maxAge: 7 * 24 * 60 * 60,
    });
  }
}

export async function clearSessionCookie() {
  const isProd = process.env.NODE_ENV === "production";
  const opts = isProd ? { path: "/", domain: ".carblink.in" } : { path: "/" };
  cookies().delete({ name: "accessToken", ...opts });
  cookies().delete({ name: "car_blink_access_token", ...opts });
  cookies().delete({ name: "car_blink_refresh_token", ...opts });
  cookies().delete({ name: "role", ...opts });
  cookies().delete({ name: "user_role", ...opts });
}
