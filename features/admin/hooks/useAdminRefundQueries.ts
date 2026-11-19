import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

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
      const pageStr = `page=${params?.page || 1}&limit=${params?.limit || 50}`;
      const queryStr = filterStr ? `?${pageStr}&${filterStr}` : `?${pageStr}`;
      
      const res = await apiClient.get(`/super-admin/refunds${queryStr}`);
      const data = res.data;
      return {
        refunds: extractArray(data, "refunds"),
        total: data?.total || data?.data?.pagination?.total || extractArray(data, "refunds").length
      };
    },
  });
};

export const useEligiblePaymentsForRefund = () => {
  return useQuery({
    queryKey: ["admin", "eligible-refunds"],
    queryFn: async () => {
      const res = await apiClient.get(`/super-admin/refunds/eligible-payments`);
      return extractArray(res.data, "payments");
    },
  });
};

export const useInitiateRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/super-admin/refunds`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "eligible-refunds"] });
    },
  });
};

export const useApproveRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/super-admin/refunds/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] });
    },
  });
};
