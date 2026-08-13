import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getExecutiveLeads, 
  getAllWebsiteLeads, 
  getEscalations, 
  getPendingFollowUps, 
  updateExecutiveLead,
  convertWebsiteLeadToBooking,
  resolveEscalation,
  assignEscalationToSelf,
  createFollowUp,
  updateFollowUp,
  getPartnerStatus,
  assignLeadToPartner,
  forwardQuoteToCustomer,
  getExecutiveTickets,
  getFollowUps,
  initiateClickToCall,
  assignDriverToBooking,
  pushDriverLocation,
  getCustomerStatus,
  verifyExecutiveCustomer,
  verifyExecutivePartner
} from "@/lib/services";
import { Lead, Escalation, FollowUp } from "@/lib/types";

// Helper to safely extract arrays from API responses
const extractArray = (res: any, key: string) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data && Array.isArray(res.data[key])) return res.data[key];
  if (res && Array.isArray(res[key])) return res[key];
  if (res?.docs && Array.isArray(res.docs)) return res.docs;
  return [];
};

export const useExecutiveLeads = (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
  return useQuery({
    queryKey: ["executive", "leads", params],
    queryFn: async () => {
      let filter = "";
      if (params?.status) filter += `status=${params.status}&`;
      if (params?.search) filter += `search=${params.search}&`;
      const res = await getExecutiveLeads(params?.page, params?.limit, filter);
      const anyRes = res as any;
      return {
        leads: extractArray(res, "leads") as Lead[],
        total: anyRes?.total || anyRes?.data?.total || extractArray(res, "leads").length
      };
    },
  });
};

export const useWebsiteLeads = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: ["executive", "website-leads", params],
    queryFn: async () => {
      const res = await getAllWebsiteLeads(params?.page, params?.limit, "", params?.search, "");
      return {
        leads: extractArray(res, "leads") as any[],
        total: res?.total || res?.data?.total || extractArray(res, "leads").length
      };
    },
  });
};

export const useServices = () => {
  return useQuery({
    queryKey: ["executive", "services"],
    queryFn: async () => {
      const m = await import("@/lib/services");
      const res = await m.getServices();
      if (res.data?.data) return res.data.data;
      if (res.data) return res.data;
      if (Array.isArray(res)) return res;
      return [];
    },
  });
};

export const useExecutiveLeadById = (id: string | null) => {
  return useQuery({
    queryKey: ["executive", "lead", id],
    queryFn: async () => {
      if (!id) return null;
      // We dynamically import getExecutiveLeadById if it's not exported at the top
      const m = await import("@/lib/services");
      const response = await m.getExecutiveLeadById(id);
      
      // Due to a global axios interceptor that aliases arrays to .data, response.data might be corrupted 
      // if the lead object contains arrays (like bids). We check if response._id exists to ensure we have the lead.
      let leadData = response;
      if (response && !response._id && response.data && !Array.isArray(response.data)) {
        leadData = response.data;
      } else if (response && !response._id && response.lead) {
        leadData = response.lead;
      }
      
      if (!leadData || !leadData._id) {
        throw new Error("Lead not found or invalid format");
      }
      return leadData;
    },
    enabled: !!id,
  });
};

export const useExecutiveTicketDetails = (id: string | null) => {
  return useQuery({
    queryKey: ["executive", "ticket", id],
    queryFn: async () => {
      if (!id) return null;
      const m = await import("@/lib/services");
      return await m.getExecutiveTicketDetails(id);
    },
    enabled: !!id,
  });
};

export const useEscalations = (params?: { page?: number; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ["executive", "escalations", params],
    queryFn: async () => {
      let filter = "";
      if (params?.status) filter += `status=${params.status}&`;
      const res = await getEscalations(params?.page, params?.limit, filter);
      return {
        escalations: extractArray(res, "escalations") as Escalation[],
        total: res?.total || res?.data?.total || extractArray(res, "escalations").length
      };
    },
  });
};

export const usePendingFollowUps = (params?: { page?: number; limit?: number; isCompleted?: boolean }) => {
  return useQuery({
    queryKey: ["executive", "follow-ups", params],
    queryFn: async () => {
      const res = await getPendingFollowUps(params?.page, params?.limit);
      return {
        followUps: extractArray(res, "followUps") as FollowUp[],
        total: res?.total || res?.data?.total || extractArray(res, "followUps").length
      };
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateExecutiveLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "leads"] });
    },
  });
};

export const useConvertWebsiteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => convertWebsiteLeadToBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "website-leads"] });
    },
  });
};

export const useResolveEscalation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { resolutionNotes: string } }) => resolveEscalation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "escalations"] });
    },
  });
};

export const useAssignEscalation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignEscalationToSelf(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "escalations"] });
    },
  });
};

export const useCreateFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createFollowUp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "follow-ups"] });
    },
  });
};

export const useUpdateFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateFollowUp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "follow-ups"] });
    },
  });
};

export const usePartnerStatus = (page?: number, limit?: number, filterStr?: string) => {
  return useQuery({
    queryKey: ["executive", "partners", page, limit, filterStr],
    queryFn: async () => {
      return await getPartnerStatus(page, limit, filterStr);
    },
  });
};

export const useAssignLeadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assignLeadToPartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "leads"] });
    },
  });
};

export const useForwardQuoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => forwardQuoteToCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "leads"] });
    },
  });
};

export const useExecutiveTickets = (statusFilter?: string) => {
  return useQuery({
    queryKey: ["executive", "tickets", statusFilter],
    queryFn: async () => {
      const query = statusFilter ? `status=${statusFilter}` : "";
      const res = await getExecutiveTickets(query);
      return res.docs || [];
    },
  });
};

export const useFollowUps = (page: number, limit: number) => {
  return useQuery({
    queryKey: ["executive", "follow-ups-all", page, limit],
    queryFn: async () => {
      const res = await getFollowUps(page, limit);
      return Array.isArray(res?.docs) ? res.docs : (Array.isArray(res?.followUps) ? res.followUps : (Array.isArray(res?.data?.followUps) ? res.data.followUps : (Array.isArray(res) ? res : [])));
    },
  });
};

export const useClickToCallMutation = () => {
  return useMutation({
    mutationFn: (data: { phoneNumber: string }) => initiateClickToCall(data),
  });
};

export const useAssignDriverMutation = () => {
  return useMutation({
    mutationFn: (data: any) => assignDriverToBooking(data),
  });
};

export const usePushLocationMutation = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pushDriverLocation(id, data),
  });
};

export const useCustomerStatus = (page: number, limit: number, search?: string) => {
  return useQuery({
    queryKey: ["executive", "customer-status", page, limit, search],
    queryFn: async () => {
      const res = await getCustomerStatus(page, limit, search);
      return {
        customers: Array.isArray(res?.docs) ? res.docs : (Array.isArray(res?.customers) ? res.customers : (Array.isArray(res?.data?.customers) ? res.data.customers : (Array.isArray(res) ? res : []))),
        total: res?.total || res?.data?.total || 0,
        page: res?.page || res?.data?.page || 1,
        limit: res?.limit || res?.data?.limit || 50
      };
    },
  });
};

export const useVerifyCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => verifyExecutiveCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "customer-status"] });
    },
  });
};

export const useVerifyPartnerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => verifyExecutivePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "partner-status"] });
    },
  });
};
