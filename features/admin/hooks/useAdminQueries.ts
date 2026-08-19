// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminFinanceSummary,
  getAdminUsers,
  getAdminRevenue,
  getCommissionReport,
  updateAdminUserStatus,
  updateAdminUserPassword,
  updateAdminUser,
  updateAdminUserStats,
  getAllAdminVehicles,
  getSuperAdminStaff,
  createSuperAdminStaff,
  getSuperAdminRoles,
  createCustomRole,
  getSuperAdminSettings,
  updateSuperAdminSettings,
  getSuperAdminPartners,
  getSuperAdminPartnerDetails,
  updateSuperAdminPartnerKyc,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getSuperAdminCoupons,

  toggleSuperAdminCoupon,
  deleteSuperAdminCoupon,
  getSuperAdminZones,
  createSuperAdminZone,
  updateSuperAdminZone,
  deleteSuperAdminZone,
  getSuperAdminNotifications,
  sendSuperAdminNotification,
  getServices,
  getCities,
  createService,
  updateService,
  deleteService,
  createCity,
  deleteCity,
  getAllWebsiteLeads,
  getSuperAdminSettlements,
  markSuperAdminSettlementPaid,
  getSuperAdminTickets,
  getSuperAdminTicketDetails,
  updateSuperAdminTicketStatus,
  addSuperAdminTicketReply,
  getAuditLogs,
  getSuperAdminBookings,
  getSuperAdminBookingDetails,
  cancelSuperAdminBooking,
  onboardVendor,
  createCoupon
} from "@/lib/services";

// ==========================================
// Dashboard & Finance
// ==========================================

export const useAdminDashboardData = () => {
  return useQuery({
    queryKey: ["admin", "dashboardData"],
    queryFn: async () => {
      const [financeRes, usersRes, revRes] = await Promise.all([
        getAdminFinanceSummary(undefined as any, undefined as any).catch(() => ({})),
        getAdminUsers(1, 1).catch(() => ({ total: 0 })),
        getAdminRevenue('all').catch(() => ({}))
      ]);
      return {
        finance: financeRes || {},
        totalUsers: usersRes?.total || 0,
        revenue: revRes || {}
      };
    }
  });
};

export const useAdminFinanceSummary = () => {
  return useQuery({
    queryKey: ["admin", "financeSummary"],
    queryFn: async () => {
      const res = await getAdminFinanceSummary(undefined as any, undefined as any);
      return res || {};
    }
  });
};

export const useAdminCommissionReport = (startDate?: string, endDate?: string, partnerId?: string) => {
  return useQuery({
    queryKey: ["admin", "commissionReport", startDate, endDate, partnerId],
    queryFn: async () => {
      const res = await getCommissionReport(startDate, endDate, partnerId);
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  });
};

export const useAdminRevenue = (timeframe: string) => {
  return useQuery({
    queryKey: ["admin", "revenue", timeframe],
    queryFn: async () => {
      const res = await getAdminRevenue(timeframe);
      return res || [];
    }
  });
};

// ==========================================
// Users & Staff
// ==========================================

export const useAdminUsers = (page: number = 1, limit: number = 20, role?: string, search?: string) => {
  return useQuery({
    queryKey: ["admin", "users", page, limit, role, search],
    queryFn: async () => {
      const res = await getAdminUsers(page, limit, role, search);
      return res;
    }
  });
};

export const useUpdateAdminUserStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isBlocked }: { id: string, isBlocked: boolean }) => updateAdminUserStatus(id, isBlocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    }
  });
};

export const useUpdateAdminUserPasswordMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string, password: string }) => updateAdminUserPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    }
  });
};

export const useUpdateAdminUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    }
  });
};

export const useUpdateAdminUserStatsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, params }: { id: string, params: any }) => updateAdminUserStats(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    }
  });
};

export const useAdminVehicles = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: ["admin", "vehicles", page, limit],
    queryFn: async () => {
      const res = await getAllAdminVehicles(page, limit);
      return res;
    }
  });
};

export const useAdminStaff = () => {
  return useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => {
      const res = await getSuperAdminStaff();
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  });
};

export const useAdminRoles = () => {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const res = await getSuperAdminRoles();
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  });
};

export const useCreateAdminStaffMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createSuperAdminStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    }
  });
};

export const useAdminCustomRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createCustomRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
    }
  });
};

// ==========================================
// Settings
// ==========================================

export const useAdminSettings = () => {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const res = await getSuperAdminSettings();
      return res?.data || res;
    }
  });
};

export const useUpdateAdminSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => updateSuperAdminSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    }
  });
};

// ==========================================
// Partners & Master Data
// ==========================================

export const useAdminPartners = (page: number = 1, limit: number = 50, status?: string) => {
  return useQuery({
    queryKey: ["admin", "partners", page, limit, status],
    queryFn: async () => {
      const res = await getSuperAdminPartners(page, limit, status);
      return res;
    }
  });
};

export const useAdminPartnerDetails = (id: string) => {
  return useQuery({
    queryKey: ["admin", "partners", id],
    queryFn: async () => {
      const res = await getSuperAdminPartnerDetails(id);
      if (res && res._id) return res;
      return res?.data || res;
    },
    enabled: !!id
  });
};

export const useUpdateAdminPartnerKycMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, remarks }: { id: string, status: string, remarks?: string }) => updateSuperAdminPartnerKyc(id, status, remarks),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "partners", variables.id] });
    }
  });
};

// ==========================================
// Notifications (General Admin)
// ==========================================

export const useAdminNotifications = () => {
  return useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: async () => {
      const res = await getNotifications();
      return Array.isArray(res?.data?.docs) ? res.data.docs 
           : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    }
  });
};

export const useMarkAdminNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    }
  });
};

export const useMarkAllAdminNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    }
  });
};

// ==========================================
// Marketing, Promotions & Zones
// ==========================================

export const useAdminCoupons = () => {
  return useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const res = await getSuperAdminCoupons();
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  });
};

export const useCreateAdminCouponMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createCoupon(data), // Using createCoupon instead of createSuperAdminCoupon in promotions
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    }
  });
};

export const useToggleAdminCouponMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleSuperAdminCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    }
  });
};

export const useDeleteAdminCouponMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSuperAdminCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    }
  });
};

export const useAdminZones = () => {
  return useQuery({
    queryKey: ["admin", "zones"],
    queryFn: async () => {
      const res = await getSuperAdminZones();
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  });
};

export const useCreateAdminZoneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createSuperAdminZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "zones"] });
    }
  });
};

export const useUpdateAdminZoneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateSuperAdminZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "zones"] });
    }
  });
};

export const useDeleteAdminZoneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSuperAdminZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "zones"] });
    }
  });
};

export const useAdminMarketingNotifications = () => {
  return useQuery({
    queryKey: ["admin", "marketingNotifications"],
    queryFn: async () => {
      const res = await getSuperAdminNotifications();
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  });
};

export const useSendAdminMarketingNotificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => sendSuperAdminNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "marketingNotifications"] });
    }
  });
};

// ==========================================
// Master Data Services & Cities
// ==========================================

export const useMasterDataServices = () => {
  return useQuery({
    queryKey: ["admin", "masterData", "services"],
    queryFn: async () => {
      const res = await getServices();
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  });
};

export const useMasterDataCities = () => {
  return useQuery({
    queryKey: ["admin", "masterData", "cities"],
    queryFn: async () => {
      const res = await getCities();
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  });
};

export const useCreateServiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "masterData", "services"] });
    }
  });
};

export const useUpdateServiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "masterData", "services"] });
    }
  });
};

export const useDeleteServiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "masterData", "services"] });
    }
  });
};

export const useCreateCityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createCity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "masterData", "cities"] });
    }
  });
};

export const useDeleteCityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "masterData", "cities"] });
    }
  });
};

// ==========================================
// Website Leads
// ==========================================

export const useAdminWebsiteLeads = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: ["admin", "websiteLeads", page, limit],
    queryFn: async () => {
      const res = await getAllWebsiteLeads(page, limit);
      return res;
    }
  });
};

// ==========================================
// Settlements
// ==========================================

export const useAdminSettlements = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: ["admin", "settlements", page, limit],
    queryFn: async () => {
      const res = await getSuperAdminSettlements(page, limit);
      return res;
    }
  });
};

export const useMarkAdminSettlementPaidMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, utr }: { id: string, utr: string }) => markSuperAdminSettlementPaid(id, { transactionReference: utr }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] });
    }
  });
};

// ==========================================
// Tickets / Helpdesk
// ==========================================

export const useAdminTickets = (page: number = 1, limit: number = 50, status?: string) => {
  return useQuery({
    queryKey: ["admin", "tickets", page, limit, status],
    queryFn: async () => {
      const res = await getSuperAdminTickets(page, limit, status);
      return res;
    }
  });
};

export const useAdminTicketDetails = (id: string) => {
  return useQuery({
    queryKey: ["admin", "tickets", id],
    queryFn: async () => {
      const res = await getSuperAdminTicketDetails(id);
      return res?.data || res;
    },
    enabled: !!id
  });
};

export const useUpdateAdminTicketStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => updateSuperAdminTicketStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets", variables.id] });
    }
  });
};

export const useAddAdminTicketReplyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string, message: string }) => addSuperAdminTicketReply(id, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets", variables.id] });
    }
  });
};

// ==========================================
// Audit Logs
// ==========================================

export const useAdminAuditLogs = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: ["admin", "auditLogs", page, limit],
    queryFn: async () => {
      const res = await getAuditLogs(page, limit);
      return res;
    }
  });
};

// ==========================================
// Bookings
// ==========================================

export const useAdminBookings = (page: number = 1, limit: number = 50, status?: string, search?: string) => {
  return useQuery({
    queryKey: ["admin", "bookings", page, limit, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      const res = await getSuperAdminBookings(params.toString());
      return res;
    }
  });
};

export const useAdminBookingDetails = (id: string) => {
  return useQuery({
    queryKey: ["admin", "bookings", id],
    queryFn: async () => {
      const res = await getSuperAdminBookingDetails(id);
      if (res?.data?._id) return res.data;
      if (res?._id) return res;
      if (res?.data) return res.data;
      return res;
    },
    enabled: !!id
  });
};

export const useCancelAdminBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => cancelSuperAdminBooking(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings", variables.id] });
    }
  });
};

// ==========================================
// Vendors
// ==========================================

export const useOnboardAdminVendorMutation = () => {
  return useMutation({
    mutationFn: (data: any) => onboardVendor(data)
  });
};
