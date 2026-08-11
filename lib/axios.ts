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

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api",
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
let logoutCallback: (() => void) | null = null;

export const setApiAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

export const setTokenRefreshProvider = (provider: () => Promise<string | null>) => {
  refreshTokenProvider = provider;
};

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const arrayKey = Object.keys(payload).find(key => Array.isArray(payload[key]));
        if (arrayKey) {
          payload.docs = payload[arrayKey];
          payload.data = payload[arrayKey];
        }
      }

      return response.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if error response has our standard error format
    let errorData = error.response?.data;
    if (errorData && typeof errorData === "object" && "error" in errorData) {
        errorData = (errorData as ApiResponse).error;
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
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
        // If refresh fails, execute logout callback
        if (logoutCallback) logoutCallback();
        return Promise.reject(errorData || error);
      } catch (refreshError) {
        if (logoutCallback) logoutCallback();
        return Promise.reject(errorData || refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(errorData || error);
  }
);
