import Cookies from "js-cookie";
import { setApiAccessToken } from "@/lib/axios";
import { clearSessionCookie } from "@/app/actions/auth";

/**
 * Session Sanitizer
 * Thoroughly wipes all client-side authentication state, tokens,
 * local/session storage keys, browser cookies, and React Query caches
 * to prevent cross-role session contamination and stale token leakage.
 */
export async function sanitizeSession(queryClient?: any): Promise<void> {
  // 1. Reset in-memory API token header
  setApiAccessToken(null);

  // 2. Clear all local storage & session storage items
  if (typeof window !== "undefined") {
    try {
      const keysToRemove = [
        "car_blink_access_token",
        "car_blink_refresh_token",
        "carBlink_token",
        "carBlink_user",
        "user_role",
        "access_token",
        "refresh_token",
      ];
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch (err) {
      console.error("[SessionSanitizer] LocalStorage clear warning:", err);
    }
  }

  // 3. Clear all browser cookies across root and subdomain paths
  try {
    const cookiesToClear = [
      "accessToken",
      "refreshToken",
      "role",
      "user_role",
      "session",
      "token",
      "car_blink_access_token",
      "car_blink_refresh_token",
      "carBlink_token",
    ];
    cookiesToClear.forEach((cookieName) => {
      Cookies.remove(cookieName, { path: "/" });
      if (typeof document !== "undefined") {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    });
    
    // Clear Next.js server cookie
    await clearSessionCookie();
  } catch (err) {
    console.error("[SessionSanitizer] Cookie clear warning:", err);
  }

  // 4. Wipe React Query cache completely if provided
  if (queryClient && typeof queryClient.clear === "function") {
    try {
      queryClient.clear();
    } catch (err) {
      console.error("[SessionSanitizer] QueryClient clear warning:", err);
    }
  }
}
