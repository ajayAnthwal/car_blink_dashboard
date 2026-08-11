"use server";

import { cookies } from "next/headers";

export async function setSessionCookie(token: string) {
  cookies().set("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });
}

export async function clearSessionCookie() {
  cookies().delete("accessToken");
}
