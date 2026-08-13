import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllRefunds, 
  getAllSettlements,
  getEligiblePaymentsForRefund,
  initiateRefund,
  approveRefund,
  processRefund,
  rejectRefund,
  processSettlement,
  getEligibleJobsForSettlement,
  generateSettlement,
  getGstReport,
  getInvoicesReport,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getActivityLogs
} from "@/lib/services";

// Helper to safely extract arrays from API responses
const extractArray = (res: any, key: string) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data && Array.isArray(res.data[key])) return res.data[key];
  if (res && Array.isArray(res[key])) return res[key];
  if (res?.docs && Array.isArray(res.docs)) return res.docs;
  return [];
};

// --- Dashboard Queries ---

export const useAccountsDashboardData = () => {
  return useQuery({
    queryKey: ["accounts", "dashboard"],
    queryFn: async () => {
      const [refundsRes, settlementsRes] = await Promise.all([
        getAllRefunds(1, 100).catch(() => ({ data: { refunds: [], total: 0 } })),
        getAllSettlements(1, 100).catch(() => ({ data: { settlements: [], total: 0 } }))
      ]);

      const refundsList = extractArray(refundsRes, "refunds");
      const settlementsList = extractArray(settlementsRes, "settlements");

      const pendingRefunds = refundsList.filter((r: any) => r.status === 'PENDING');
      const pendingSettlements = settlementsList.filter((s: any) => s.status === 'PENDING');

      return {
        refundsList,
        settlementsList,
        stats: {
          pendingRefunds: pendingRefunds.length,
          pendingSettlements: pendingSettlements.length,
          totalRefundsAmount: refundsList.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0),
          totalSettlementsAmount: settlementsList.reduce((sum: number, s: any) => sum + (Number(s.netPayoutAmount) || Number(s.grossAmount) || 0), 0)
        }
      };
    },
  });
};

export const useActivityLogs = (limit: number = 10) => {
  return useQuery({
    queryKey: ["accounts", "activity-logs", limit],
    queryFn: async () => {
      const res = await getActivityLogs(limit);
      return extractArray(res, "data") || extractArray(res, "logs") || res;
    },
  });
};

// --- Refunds Queries & Mutations ---

export const useRefunds = (params?: { page?: number; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ["accounts", "refunds", params],
    queryFn: async () => {
      let filterStr = "";
      if (params?.status) {
        filterStr = `status=${params.status}`;
      }
      const res = await getAllRefunds(params?.page || 1, params?.limit || 10, filterStr);
      return {
        refunds: extractArray(res, "refunds"),
        total: res?.total || res?.data?.total || extractArray(res, "refunds").length
      };
    },
  });
};

export const useEligiblePaymentsForRefund = () => {
  return useQuery({
    queryKey: ["accounts", "eligible-refunds"],
    queryFn: async () => {
      const res = await getEligiblePaymentsForRefund();
      return extractArray(res, "payments");
    },
  });
};

export const useInitiateRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => initiateRefund(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "refunds"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", "eligible-refunds"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", "dashboard"] });
    },
  });
};

export const useApproveRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveRefund(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "refunds"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", "dashboard"] });
    },
  });
};

export const useProcessRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string, pin: string }) => processRefund(data.id, { pin: data.pin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "refunds"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", "dashboard"] });
    },
  });
};

export const useRejectRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => rejectRefund(id, { rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "refunds"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", "dashboard"] });
    },
  });
};

// --- Settlements Queries & Mutations ---

export const useSettlements = (params?: { page?: number; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ["accounts", "settlements", params],
    queryFn: async () => {
      let filterStr = "";
      if (params?.status) {
        filterStr = `status=${params.status}`;
      }
      const res = await getAllSettlements(params?.page || 1, params?.limit || 10, filterStr);
      return {
        settlements: extractArray(res, "settlements"),
        total: res?.total || res?.data?.total || extractArray(res, "settlements").length
      };
    },
  });
};

export const useEligibleJobsForSettlement = () => {
  return useQuery({
    queryKey: ["accounts", "eligible-settlements"],
    queryFn: async () => {
      const res = await getEligibleJobsForSettlement();
      return extractArray(res, "jobs");
    },
  });
};

export const useGenerateSettlementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => generateSettlement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "settlements"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", "eligible-settlements"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", "dashboard"] });
    },
  });
};

export const useProcessSettlementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string, transactionReference?: string, pin: string }) => 
      processSettlement(data.id, { transactionReference: data.transactionReference, pin: data.pin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "settlements"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", "dashboard"] });
    },
  });
};

// --- Reports Queries & Mutations ---

export const useGstReportMutation = () => {
  return useMutation({
    mutationFn: ({ fromDate, toDate }: { fromDate: string, toDate: string }) => getGstReport(fromDate, toDate),
  });
};

export const useInvoicesReportMutation = () => {
  return useMutation({
    mutationFn: ({ fromDate, toDate, cityId, serviceId }: { fromDate: string, toDate: string, cityId?: string, serviceId?: string }) => getInvoicesReport(fromDate, toDate, cityId, serviceId),
  });
};

// --- Notifications Queries & Mutations ---

export const useAccountsNotifications = () => {
  return useQuery({
    queryKey: ["accounts", "notifications"],
    queryFn: async () => {
      const res = await getNotifications();
      return Array.isArray(res?.data?.docs) ? res.data.docs 
           : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    },
  });
};

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "notifications"] });
    },
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "notifications"] });
    },
  });
};
