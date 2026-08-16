// @ts-nocheck
"use server";

import { cookies } from "next/headers";

export async function setSessionCookie(token: string) {
  cookies().set("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

export async function clearSessionCookie() {
  cookies().delete("accessToken");
}
