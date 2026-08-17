// @ts-nocheck
"use server";

import { cookies } from "next/headers";

export async function setSessionCookie(token: string, role?: string) {
  cookies().set("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
  if (role) {
    cookies().set("role", role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  }
}

export async function clearSessionCookie() {
  cookies().delete("accessToken");
  cookies().delete("role");
}
