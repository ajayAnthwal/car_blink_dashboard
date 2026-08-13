import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInventory, addStockItem, updateStockItem, deleteStockItem, updatePartnerCapacity, getPosInvoices, generatePosInvoice, getStaff, addPartnerStaff, updateStaffStatus, updateStaffMember, deleteStaffMember, getKycDocuments, uploadKycDocument, getPartnerWarranties, issueJobWarranty, getPartnerReviews } from "@/lib/services";

export const useInventory = () => {
  return useQuery({
    queryKey: ["partner", "inventory"],
    queryFn: async () => {
      const res = await getInventory();
      let dataArray = [];
      if (Array.isArray(res)) dataArray = res;
      else if (res?.data && Array.isArray(res.data)) dataArray = res.data;
      else if (res?.docs && Array.isArray(res.docs)) dataArray = res.docs;
      else if (res?.data?.docs && Array.isArray(res.data.docs)) dataArray = res.data.docs;
      return dataArray;
    },
  });
};

export const useAddInventoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => addStockItem(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "inventory"] }),
  });
};

export const useUpdateInventoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateStockItem(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "inventory"] }),
  });
};

export const useDeleteInventoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStockItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "inventory"] }),
  });
};

export const useUpdateCapacityMutation = () => {
  return useMutation({
    mutationFn: (payload: any) => updatePartnerCapacity(payload),
  });
};

export const usePosInvoices = () => {
  return useQuery({
    queryKey: ["partner", "pos-invoices"],
    queryFn: async () => {
      const res = await getPosInvoices();
      let dataArray = [];
      if (Array.isArray(res)) dataArray = res;
      else if (res?.data?.docs && Array.isArray(res.data.docs)) dataArray = res.data.docs;
      else if (res?.data && Array.isArray(res.data)) dataArray = res.data;
      else if (res?.docs && Array.isArray(res.docs)) dataArray = res.docs;
      return dataArray;
    },
  });
};

export const useGeneratePosInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => generatePosInvoice(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "pos-invoices"] }),
  });
};

export const useStaff = () => {
  return useQuery({
    queryKey: ["partner", "staff"],
    queryFn: async () => {
      const res = await getStaff();
      let dataArray = [];
      if (Array.isArray(res)) dataArray = res;
      else if (res?.data && Array.isArray(res.data)) dataArray = res.data;
      else if (res?.docs && Array.isArray(res.docs)) dataArray = res.docs;
      else if (res?.data?.docs && Array.isArray(res.data.docs)) dataArray = res.data.docs;
      return dataArray;
    },
  });
};

export const useAddStaffMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => addPartnerStaff(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "staff"] }),
  });
};

export const useUpdateStaffMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateStaffMember(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "staff"] }),
  });
};

export const useUpdateStaffStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateStaffStatus(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "staff"] }),
  });
};

export const useDeleteStaffMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStaffMember(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "staff"] }),
  });
};

export const useKycDocuments = () => {
  return useQuery({
    queryKey: ["partner", "kyc-documents"],
    queryFn: async () => {
      const res = await getKycDocuments();
      const dataArray = res?.data?.docs || res?.data || res?.docs || [];
      return Array.isArray(dataArray) ? dataArray : [];
    },
  });
};

export const useUploadKycDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => uploadKycDocument(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "kyc-documents"] }),
  });
};

export const usePartnerWarranties = () => {
  return useQuery({
    queryKey: ["partner", "warranties"],
    queryFn: async () => {
      const res = await getPartnerWarranties();
      const dataArray = res?.data?.docs || res?.data || res?.docs || [];
      return Array.isArray(dataArray) ? dataArray : [];
    },
  });
};

export const useIssueWarrantyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, payload }: { jobId: string; payload: any }) => issueJobWarranty(jobId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "warranties"] }),
  });
};

export const usePartnerReviews = (partnerId?: string) => {
  return useQuery({
    queryKey: ["partner", "reviews", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const data = await getPartnerReviews(partnerId);
      return data?.data?.reviews || data?.reviews || data?.data || [];
    },
    enabled: !!partnerId,
  });
};

export const usePartnerNotifications = () => {
  return useQuery({
    queryKey: ["partner", "notifications"],
    queryFn: async () => {
      const res = await import("@/lib/services").then(m => m.getNotifications());
      return Array.isArray(res?.data?.docs) ? res.data.docs 
           : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    },
  });
};

export const useMarkPartnerNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => import("@/lib/services").then(m => m.markNotificationAsRead(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "notifications"] });
    },
  });
};

export const useMarkAllPartnerNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => import("@/lib/services").then(m => m.markAllNotificationsAsRead()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "notifications"] });
    },
  });
};
