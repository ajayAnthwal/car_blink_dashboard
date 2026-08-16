import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Mock basic API fetcher since we know the routes
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("carblink_admin_token") || localStorage.getItem("carblink_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const fetchJson = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "An error occurred");
  }
  return res.json();
};

// Helper to safely extract arrays from API responses
const extractArray = (res: any, key: string) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data && Array.isArray(res.data[key])) return res.data[key];
  if (res && Array.isArray(res[key])) return res[key];
  if (res?.docs && Array.isArray(res.docs)) return res.docs;
  return [];
};

export const useRefunds = (params?: { page?: number; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ["admin", "refunds", params],
    queryFn: async () => {
      let filterStr = "";
      if (params?.status) {
        filterStr = `status=${params.status}`;
      }
      const pageStr = `page=${params?.page || 1}&limit=${params?.limit || 10}`;
      const queryStr = filterStr ? `?${pageStr}&${filterStr}` : `?${pageStr}`;
      
      const res = await fetchJson(`/super-admin/refunds${queryStr}`);
      return {
        refunds: extractArray(res, "refunds"),
        total: res?.total || res?.data?.pagination?.total || extractArray(res, "refunds").length
      };
    },
  });
};

export const useEligiblePaymentsForRefund = () => {
  return useQuery({
    queryKey: ["admin", "eligible-refunds"],
    queryFn: async () => {
      const res = await fetchJson(`/super-admin/refunds/eligible-payments`);
      return extractArray(res, "payments");
    },
  });
};

export const useInitiateRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchJson(`/super-admin/refunds`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "eligible-refunds"] });
    },
  });
};

export const useApproveRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/super-admin/refunds/${id}/approve`, {
      method: 'PATCH',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] });
    },
  });
};
