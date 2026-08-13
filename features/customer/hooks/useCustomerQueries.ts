import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookings, getPaymentHistory, getWarranties, getCustomerStats, getGarageVehicles, getServices, getCities, getVehicleBrands, getVehicleModels, getCurrentUserProfile, getSupportTickets, createGarageVehicle, updateGarageVehicle, deleteGarageVehicle, createSupportTicket, replySupportTicket, createBooking, cancelBooking, selectBookingQuote, respondToJobExtension, getBookingQuotes, getMyReviews, createReview, checkSubscriptionValidity, purchaseSubscription, getWarrantyById, requestRSA, applyReferral, getNotifications, markNotificationAsRead, markAllNotificationsAsRead, initiatePayment, getBookingById, canReviewBooking, applyCouponToBooking } from "@/lib/services";
import { Booking, Payment, Warranty } from "@/lib/types";

// Helper to safely extract arrays from the API responses
const extractArray = (res: any, key: string) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data && Array.isArray(res.data[key])) return res.data[key];
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
  if (res && Array.isArray(res[key])) return res[key];
  if (res?.docs && Array.isArray(res.docs)) return res.docs;
  return [];
};

export const useCustomerBookings = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: ["customer", "bookings", params],
    queryFn: async () => {
      const res = await getBookings(params);
      const bookingsArray = extractArray(res, "bookings") as Booking[];
      let totalCount = 0;

      if (res?.total) {
        totalCount = res.total;
      } else if (res?.data?.total) {
        totalCount = res.data.total;
      } else {
        totalCount = bookingsArray.length;
      }

      return {
        bookings: bookingsArray,
        total: totalCount
      };
    },
  });
};

export const useBookingDetails = (id: string | null) => {
  return useQuery({
    queryKey: ["customer", "bookings", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await getBookingById(id);
      if (res?._id) return res;
      if (res?.data?._id) return res.data;
      return res?.data?.booking || res?.data?.data || res?.data || res;
    },
    enabled: !!id,
  });
};

export const useCanReviewBooking = (id: string | null) => {
  return useQuery({
    queryKey: ["customer", "bookings", id, "can-review"],
    queryFn: async () => {
      if (!id) return false;
      const res = await canReviewBooking(id);
      return res?.canReview || res?.data?.canReview || false;
    },
    enabled: !!id,
  });
};

export const useCustomerPayments = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: ["customer", "payments", params],
    queryFn: async () => {
      const res = await getPaymentHistory();
      return {
        payments: extractArray(res, "payments") as Payment[],
        total: res?.total || res?.data?.total || extractArray(res, "payments").length
      };
    },
  });
};

export const useCustomerWarranties = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: ["customer", "warranties", params],
    queryFn: async () => {
      const res = await getWarranties();
      return {
        warranties: extractArray(res, "warranties") as Warranty[],
        total: res?.total || res?.data?.total || extractArray(res, "warranties").length
      };
    },
  });
};

export const useCustomerStatsQuery = () => {
  return useQuery({
    queryKey: ["customer", "stats"],
    queryFn: async () => {
      const res = await getCustomerStats();
      return {
        totalSavings: res?.data?.totalSavings || 0,
        rewardPoints: res?.data?.rewardPoints || 0,
      };
    },
  });
};

export const useGarageVehicles = () => {
  return useQuery({
    queryKey: ["customer", "vehicles"],
    queryFn: async () => {
      const res = await getGarageVehicles();
      return extractArray(res, "vehicles");
    },
  });
};

export const useServices = () => {
  return useQuery({
    queryKey: ["metadata", "services"],
    queryFn: async () => {
      const res = await getServices();
      return extractArray(res, "services");
    },
  });
};

export const useCities = () => {
  return useQuery({
    queryKey: ["metadata", "cities"],
    queryFn: async () => {
      const res = await getCities();
      return extractArray(res, "cities");
    },
  });
};

export const useVehicleBrands = () => {
  return useQuery({
    queryKey: ["metadata", "brands"],
    queryFn: async () => {
      const res = await getVehicleBrands();
      return extractArray(res, "brands");
    },
  });
};

export const useVehicleModels = (brandId: string) => {
  return useQuery({
    queryKey: ["metadata", "models", brandId],
    queryFn: async () => {
      if (!brandId) return [];
      const res = await getVehicleModels(brandId);
      return extractArray(res, "models");
    },
    enabled: !!brandId, // Only fetch when a brand is selected
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["customer", "profile"],
    queryFn: async () => {
      const res = await getCurrentUserProfile();
      return res?.data?.profile || res?.data || res;
    },
  });
};

export const useSupportTickets = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: ["customer", "support-tickets", params],
    queryFn: async () => {
      const res = await getSupportTickets(params);
      const ticketsArray = extractArray(res, "tickets");
      return {
        tickets: ticketsArray,
        total: res?.total || res?.data?.total || ticketsArray.length
      };
    },
  });
};

// --- Mutations ---

export const useAddGarageVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createGarageVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "vehicles"] });
    },
  });
};

export const useUpdateGarageVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateGarageVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "vehicles"] });
    },
  });
};

export const useDeleteGarageVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGarageVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "vehicles"] });
    },
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createSupportTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "support-tickets"] });
    },
  });
};

export const useReplySupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => replySupportTicket(id, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "support-tickets"] });
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelBooking(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] });
    },
  });
};

export const useApplyCouponMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, couponCode }: { bookingId: string; couponCode: string }) => applyCouponToBooking(bookingId, { couponCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] });
    },
  });
};

export const useSelectQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, bidId }: { bookingId: string; bidId: string }) => selectBookingQuote(bookingId, { bidId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] });
    },
  });
};

export const useRespondToExtension = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, extId, status }: { bookingId: string; extId: string; status: "APPROVED" | "REJECTED" }) => respondToJobExtension(bookingId, extId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] });
    },
  });
};

export const useBookingQuotes = (bookingId: string | null) => {
  return useQuery({
    queryKey: ["customer", "booking-quotes", bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      const res = await getBookingQuotes(bookingId);
      return Array.isArray(res) ? res : (res?.docs || res?.data?.bids || res?.bids || res?.data || []);
    },
    enabled: !!bookingId,
  });
};

export const useInitiatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => initiatePayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "payments"] });
    },
  });
};

export const useCustomerLiveTrackingMutation = () => {
  return useMutation({
    mutationFn: (bookingId: string) => import("@/lib/services").then(m => m.getCustomerLiveTracking(bookingId)),
  });
};

export const useCustomerReviews = () => {
  return useQuery({
    queryKey: ["customer", "reviews"],
    queryFn: async () => {
      const res = await getMyReviews();
      return Array.isArray(res) ? res : (res?.docs || res?.data || []);
    },
  });
};

export const useCreateReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => createReview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "reviews"] });
    },
  });
};

export const useActiveSubscription = () => {
  return useQuery({
    queryKey: ["customer", "active-subscription"],
    queryFn: async () => {
      const res = await checkSubscriptionValidity();
      return res?.data || null;
    },
  });
};

export const usePurchaseSubscriptionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => purchaseSubscription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "active-subscription"] });
    },
  });
};

export const useWarrantyDetails = (warrantyId: string | null) => {
  return useQuery({
    queryKey: ["customer", "warranty", warrantyId],
    queryFn: async () => {
      if (!warrantyId) return null;
      const res = await getWarrantyById(warrantyId);
      return Array.isArray(res) ? res : (res?.docs || res?.data || []);
    },
    enabled: !!warrantyId,
  });
};

export const useRequestRSAMutation = () => {
  return useMutation({
    mutationFn: (payload: any) => requestRSA(payload)
  });
};

export const useApplyReferralMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => applyReferral(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "stats"] });
    },
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ["customer", "notifications"],
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
      queryClient.invalidateQueries({ queryKey: ["customer", "notifications"] });
    },
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "notifications"] });
    },
  });
};

