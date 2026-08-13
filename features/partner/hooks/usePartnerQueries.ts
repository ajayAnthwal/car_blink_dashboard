// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { getPartnerJobs, getPartnerBids, getEarningsSummary, getPartnerEarnings, getPartnerSettlements, getPartnerProfile, getLeads, createBid, createPartnerProfile, updatePartnerProfile, getWalletStatement } from "@/lib/services";
import { Job, Bid, Lead, PartnerProfile, EarningsSummary } from "@/lib/types";

// Helper function to extract array from paginated response
const extractArray = (res: any, key: string) => {
  if (Array.isArray(res)) return res;
  if (res?.docs && Array.isArray(res.docs)) return res.docs;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.[key] && Array.isArray(res[key])) return res[key];
  if (res?.data?.[key] && Array.isArray(res.data[key])) return res.data[key];
  return [];
};

export const usePartnerJobs = (params?: { page?: number; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ["partner", "jobs", params],
    queryFn: async () => {
      const queryStr = params?.status ? `status=${params.status}` : undefined;
      const res = await getPartnerJobs(params?.page ? Number(params.page) : undefined, params?.limit ? Number(params.limit) : undefined, queryStr);
      return {
        jobs: extractArray(res, "jobs") as Job[],
        total: res?.total || res?.data?.total || extractArray(res, "jobs").length
      };
    },
  });
};

export const usePartnerBids = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["partner", "bids", params],
    queryFn: async () => {
      const res = await getPartnerBids(params?.page ? Number(params.page) : undefined, params?.limit ? Number(params.limit) : undefined);
      return {
        bids: extractArray(res, "bids") as Bid[],
        total: res?.total || res?.data?.total || extractArray(res, "bids").length
      };
    },
  });
};

export const usePartnerEarnings = () => {
  return useQuery({
    queryKey: ["partner", "earnings"],
    queryFn: async () => {
      const res: any = await getEarningsSummary();
      const earningsData: EarningsSummary = res?.lifetimeEarnings !== undefined ? res : res?.data;
      return earningsData || { totalEarnings: 0, completedJobs: 0, pendingPayments: 0, monthlyTrend: [] };
    },
  });
};

export const usePartnerProfile = () => {
  return useQuery({
    queryKey: ["partner", "profile"],
    queryFn: async () => {
      const res: any = await getPartnerProfile();
      const profileData: PartnerProfile = res?.rating !== undefined || res?._id ? res : res?.data;
      return profileData;
    },
  });
};

export const useWalletStatement = () => {
  return useQuery({
    queryKey: ["partner", "wallet"],
    queryFn: async () => {
      const res = await getWalletStatement();
      return res;
    },
  });
};

export const usePartnerLeads = () => {
  return useQuery({
    queryKey: ["partner", "leads"],
    queryFn: async () => {
      const res = await getLeads();
      return {
        leads: extractArray(res, "leads") as Lead[],
        total: res?.total || res?.data?.total || extractArray(res, "leads").length
      };
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startJob, completeJob, uploadJobInvoice, uploadJobPhotos, assignStaffToJob, requestJobExtension, deleteJobPhoto, markOfflinePayment, withdrawBid, createDuesOrder, verifyDuesPayment, requestWithdrawal, getStaff, verifyOfflinePayment } from "@/lib/services";

export const useCreateDuesOrderMutation = () => {
  return useMutation({
    mutationFn: (amount: number) => createDuesOrder(amount),
  });
};

export const useVerifyDuesPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { orderId: string; paymentId: string; signature: string; amount: number }) => verifyDuesPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "wallet"] });
    },
  });
};

export const useRequestWithdrawalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => requestWithdrawal(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "wallet"] });
    },
  });
};

export const useStartJobMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => startJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "jobs"] });
    },
  });
};

export const useCompleteJobMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, payload }: { jobId: string; payload: any }) => completeJob(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "jobs"] });
    },
  });
};

export const useUploadInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, payload }: { jobId: string; payload: any }) => uploadJobInvoice(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "jobs"] });
    },
  });
};

export const useAssignStaffMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, mechanicId }: { jobId: string; mechanicId: string }) => assignStaffToJob(jobId, mechanicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "jobs"] });
    },
  });
};

export const useRequestJobExtensionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, payload }: { jobId: string; payload: any }) => requestJobExtension(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "jobs"] });
    },
  });
};

export const usePartnerStaff = () => {
  return useQuery({
    queryKey: ["partner", "staff"],
    queryFn: async () => {
      const res = await getStaff();
      return extractArray(res, "staff");
    }
  });
};

export const useDeletePhotoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, photoUrl, type }: { jobId: string; photoUrl: string; type: "BEFORE" | "AFTER" }) => deleteJobPhoto(jobId, photoUrl, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "jobs"] });
    },
  });
};

export const useUploadPhotosMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, formData }: { jobId: string; formData: FormData }) => uploadJobPhotos(jobId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "jobs"] });
    },
  });
};

export const useMarkOfflinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, amount, paymentType }: { bookingId: string; amount: number; paymentType: string }) => markOfflinePayment({ bookingId, amount, paymentType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "jobs"] });
    },
  });
};

export const useVerifyOfflinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => verifyOfflinePayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "jobs"] });
    },
  });
};
export const useWithdrawBidMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bidId: string) => withdrawBid(bidId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "bids"] });
    },
  });
};

export const usePartnerEarningsList = (period: "today" | "week" | "month") => {
  return useQuery({
    queryKey: ["partner", "earnings", "list", period],
    queryFn: async () => {
      const res: any = await getPartnerEarnings(period);
      return {
        transactions: res?.transactions || [],
        totalEarnings: res?.totalEarnings || 0,
        cashCollected: res?.cashCollected || 0,
        onlineEarnings: res?.onlineEarnings || 0
      };
    },
  });
};

export const usePartnerSettlements = () => {
  return useQuery({
    queryKey: ["partner", "settlements"],
    queryFn: async () => {
      const res = await getPartnerSettlements();
      return extractArray(res, "settlements");
    },
  });
};
export const useCreateBidMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => createBid(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "leads"] });
    },
  });
};

export const useCreatePartnerProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => createPartnerProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "profile"] });
    },
  });
};

export const useUpdatePartnerProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => updatePartnerProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "profile"] });
    },
  });
};
