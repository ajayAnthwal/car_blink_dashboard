import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Standard API response format from our backend
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    message: string;
    errorCode?: string;
  };
}

const formatApiUrl = (rawUrl?: string): string => {
  if (!rawUrl) return "";
  let cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `http://${cleanUrl}`;
  }
  return cleanUrl;
};

export const API_BASE_URL = formatApiUrl(
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
);

if (!API_BASE_URL && typeof window !== "undefined") {
  console.warn("⚠️ NEXT_PUBLIC_API_URL environment variable is not set!");
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// In-memory token storage for the apiClient (managed by AuthContext)
let inMemoryToken: string | null = null;
let refreshTokenProvider: (() => Promise<string | null>) | null = null;
let logoutCallback: ((force?: boolean) => void) | null = null;

export const setApiAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

export const setTokenRefreshProvider = (provider: () => Promise<string | null>) => {
  refreshTokenProvider = provider;
};

export const setLogoutCallback = (callback: (force?: boolean) => void) => {
  logoutCallback = callback;
};

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token = inMemoryToken;
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("car_blink_access_token") || localStorage.getItem("carBlink_token");
      if (!token && document.cookie) {
        const match = document.cookie.match(/(?:^|;\s*)(?:accessToken|car_blink_access_token)=([^;]+)/);
        if (match && match[1]) {
          token = decodeURIComponent(match[1]);
        }
      }
    }
    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function sanitizeErrorMessage(msg: string): string {
  if (!msg) return 'Something went wrong. Please try again.';
  
  let cleaned = msg.replace(/^Validation Error:\s*/i, '').trim();
  const lower = cleaned.toLowerCase();
  
  if (
    lower.includes('network error') || 
    lower.includes('axioserror') || 
    lower.includes('econnrefused') ||
    lower.includes('failed to fetch')
  ) {
    return 'Unable to connect right now. Please check your internet connection and try again.';
  }

  if (lower.includes('status code 404') || lower.includes('not found') || lower.includes('404')) {
    return 'Requested item or route was not found.';
  }
  
  if (lower.includes('api') || lower.includes('json') || lower.includes('doctype') || lower.includes('html') || lower.includes('syntaxerror')) {
    return 'Data could not be loaded. Please refresh or try again.';
  }

  if (lower.includes('e11000') || lower.includes('duplicate key')) {
    if (lower.includes('email') && !lower.includes('index: phone') && !lower.includes('dup key: { phone')) {
      return 'This email address is already registered. Please sign in or use a different email.';
    }
    if ((lower.includes('phone') || lower.includes('mobile')) && !lower.includes('index: email') && !lower.includes('dup key: { email')) {
      return 'This phone number is already registered. Please sign in or use a different phone number.';
    }
    return 'An account with these details already exists. Please check your input.';
  }

  return cleaned;
}

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Automatically unwrap { success, message, data } response wrapper
    if (response.data && "success" in response.data) {
      if (!response.data.success) {
        return Promise.reject(response.data);
      }
      
      const payload = response.data.data;
      
      // MAGIC FIX for UI components:
      // If payload is an object (e.g. { bookings: [] }), alias the array to .docs and .data
      // This prevents the UI from failing when it does res?.data?.docs or res?.docs
      if (payload && typeof payload === 'object' && !Array.isArray(payload) && !('role' in payload) && !('email' in payload)) {
        const arrayKey = Object.keys(payload).find(key => Array.isArray(payload[key]));
        if (arrayKey && arrayKey !== 'deviceTokens') {
          if (!('docs' in payload)) {
            payload.docs = payload[arrayKey];
          }
          if (!('data' in payload)) {
            payload.data = payload[arrayKey];
          }
        }
      }

      return response.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if error response has standard format or HTML
    let rawErrorData: any = error.response?.data;
    let cleanMessage = "An unexpected error occurred. Please try again.";
    
    if (rawErrorData && typeof rawErrorData === "object") {
      cleanMessage = rawErrorData.message || rawErrorData.error?.message || rawErrorData.error || cleanMessage;
    } else if (typeof rawErrorData === "string" && rawErrorData.trim()) {
      if (rawErrorData.includes("<!DOCTYPE") || rawErrorData.includes("<html")) {
        cleanMessage = "Data could not be loaded. Please refresh or try again.";
      } else {
        cleanMessage = rawErrorData;
      }
    } else if (error.message) {
      cleanMessage = error.message;
    }

    cleanMessage = sanitizeErrorMessage(cleanMessage);

    const errorData = { message: cleanMessage };

    // Prevent infinite loop if the auth request itself returns 401
    if (
      error.response?.status === 401 &&
      (originalRequest.url?.includes("/auth/refresh-token") ||
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/verify-otp"))
    ) {
      return Promise.reject(errorData || error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            if (token) {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (refreshTokenProvider) {
          const newAccessToken = await refreshTokenProvider();
          if (newAccessToken) {
            inMemoryToken = newAccessToken;
            onRefreshed(newAccessToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return apiClient(originalRequest);
          }
        }
        // If refresh fails, execute logout callback ONLY if user is not already on login page
        if (logoutCallback && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          logoutCallback(true);
        }
        onRefreshed("");
        return Promise.reject(errorData || error);
      } catch (refreshError) {
        if (logoutCallback && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          logoutCallback(true);
        }
        onRefreshed("");
        return Promise.reject(errorData || refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(errorData || error);
  }
);
