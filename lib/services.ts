import { apiClient } from "./axios";

// ==========================================
// AUTHENTICATION APIs
// ==========================================

export const registerUser = async (data: { fullName: string; email: string; phone: string; password: string; role: string }) => {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};

export const verifyOtp = async (data: { identifier: string; otp: string }) => {
  const response = await apiClient.post("/auth/verify-otp", data);
  return response.data;
};

export const loginUser = async (data: { identifier: string; password: string }) => {
  const response = await apiClient.post("/auth/login", data);
  return response.data;
};

export const refreshToken = async (data: { refreshToken: string }) => {
  const response = await apiClient.post("/auth/refresh-token", data);
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post("/auth/logout");
  return response.data;
};

export const forgotPassword = async (data: { identifier: string }) => {
  const response = await apiClient.post("/auth/forgot-password", data);
  return response.data;
};

export const resetPassword = async (data: { identifier: string; token: string; newPassword: string }) => {
  const response = await apiClient.post("/auth/reset-password", data);
  return response.data;
};

export const getCurrentUserProfile = async () => {
  const response = await apiClient.get("/auth/me");
  return response.data;
};

// ==========================================
// USER PROFILE APIs
// ==========================================

export const getUserProfile = async () => {
  const response = await apiClient.get("/users/profile");
  return response.data;
};

export const updateUserProfile = async (data: { fullName?: string; profileImage?: string }) => {
  const response = await apiClient.patch("/users/profile", data);
  return response.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) => {
  const response = await apiClient.patch("/users/change-password", data);
  return response.data;
};

export const deactivateAccount = async () => {
  const response = await apiClient.patch("/users/deactivate");
  return response.data;
};

export const registerDeviceToken = async (data: { deviceToken: string }) => {
  const response = await apiClient.patch("/users/device-token", data);
  return response.data;
};

// ==========================================
// UPLOAD APIs
// ==========================================

export const uploadFile = async (file: File, folder?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) {
    formData.append("folder", folder);
  }

  const response = await apiClient.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// ==========================================
// MASTER DATA APIs (Public)
// ==========================================

export const getCities = async (page = 1, limit = 100) => {
  const response = await apiClient.get(`/cities?page=${page}&limit=${limit}`);
  return response.data;
};

export const getServices = async (page = 1, limit = 100) => {
  const response = await apiClient.get(`/services?page=${page}&limit=${limit}`);
  return response.data;
};

export const getVehicleBrands = async () => {
  const response = await apiClient.get("/vehicle-brands");
  return response.data;
};

export const getVehicleModels = async (brandId: string) => {
  const response = await apiClient.get(`/vehicle-models?brandId=${brandId}`);
  return response.data;
};

// ==========================================
// MASTER DATA APIs (Super Admin Only)
// ==========================================

export const createCity = async (data: { name: string; state: string }) => {
  const response = await apiClient.post("/cities", data);
  return response.data;
};

export const updateCity = async (id: string, data: { name?: string; state?: string }) => {
  const response = await apiClient.patch(`/cities/${id}`, data);
  return response.data;
};

export const deleteCity = async (id: string) => {
  const response = await apiClient.delete(`/cities/${id}`);
  return response.data;
};

export const createService = async (data: { name: string; icon: string; category?: string }) => {
  const response = await apiClient.post("/services", data);
  return response.data;
};

export const updateService = async (id: string, data: { name?: string; icon?: string; category?: string }) => {
  const response = await apiClient.patch(`/services/${id}`, data);
  return response.data;
};

export const deleteService = async (id: string) => {
  const response = await apiClient.delete(`/services/${id}`);
  return response.data;
};

export const createVehicleBrand = async (data: { name: string; logo?: string }) => {
  const response = await apiClient.post("/vehicle-brands", data);
  return response.data;
};

export const createVehicleModel = async (data: { brandId: string; name: string }) => {
  const response = await apiClient.post("/vehicle-models", data);
  return response.data;
};

// ==========================================
// CUSTOMER GARAGE APIs
// ==========================================

export const getGarageVehicles = async () => {
  const response = await apiClient.get("/customer/garage");
  return response.data;
};

export const createGarageVehicle = async (data: { brand: string; model: string; registrationNumber: string; fuelType: string; year: number }) => {
  const response = await apiClient.post("/customer/garage", data);
  return response.data;
};

export const updateGarageVehicle = async (id: string, data: Partial<{ brand: string; model: string; registrationNumber: string; fuelType: string; year: number }>) => {
  const response = await apiClient.patch(`/customer/garage/${id}`, data);
  return response.data;
};

export const deleteGarageVehicle = async (id: string) => {
  const response = await apiClient.delete(`/customer/garage/${id}`);
  return response.data;
};

// ==========================================
// CUSTOMER BOOKING APIs
// ==========================================

export const createBooking = async (data: { vehicleId: string; serviceId: string; cityId: string; description: string; preferredDate: string }) => {
  const response = await apiClient.post("/customer/bookings", data);
  return response.data;
};

export const getBookings = async () => {
  const response = await apiClient.get("/customer/bookings");
  return response.data;
};

export const getBookingById = async (id: string) => {
  const response = await apiClient.get(`/customer/bookings/${id}`);
  return response.data;
};

export const cancelBooking = async (id: string, data: { reason: string }) => {
  const response = await apiClient.patch(`/customer/bookings/${id}/cancel`, data);
  return response.data;
};

export const getBookingQuotes = async (id: string) => {
  const response = await apiClient.get(`/customer/bookings/${id}/quotes`);
  return response.data;
};

export const selectBookingQuote = async (id: string, data: { bidId: string }) => {
  const response = await apiClient.post(`/customer/bookings/${id}/select-quote`, data);
  return response.data;
};

// ==========================================
// CUSTOMER WARRANTY APIs
// ==========================================

export const getWarranties = async () => {
  const response = await apiClient.get("/customer/warranties");
  return response.data;
};

export const getWarrantyById = async (id: string) => {
  const response = await apiClient.get(`/customer/warranties/${id}`);
  return response.data;
};

// ==========================================
// CUSTOMER SUPPORT TICKET APIs
// ==========================================

export const createSupportTicket = async (data: { bookingId: string; subject: string; description: string; priority: string }) => {
  const response = await apiClient.post("/customer/support-tickets", data);
  return response.data;
};

export const getSupportTickets = async () => {
  const response = await apiClient.get("/customer/support-tickets");
  return response.data;
};

export const getSupportTicketById = async (id: string) => {
  const response = await apiClient.get(`/customer/support-tickets/${id}`);
  return response.data;
};

export const replySupportTicket = async (id: string, data: { message: string }) => {
  const response = await apiClient.post(`/customer/support-tickets/${id}/reply`, data);
  return response.data;
};

// ==========================================
// CUSTOMER PAYMENT APIs
// ==========================================

export const initiatePayment = async (data: { bookingId: string; amount: number; paymentType: string }) => {
  const response = await apiClient.post("/payment/initiate", data);
  return response.data;
};

export const verifyPayment = async (data: { paymentId: string; orderId: string; signature: string }) => {
  const response = await apiClient.post("/payment/verify", data);
  return response.data;
};

export const getPaymentHistory = async () => {
  const response = await apiClient.get("/payment/history");
  return response.data;
};

export const getPaymentById = async (id: string) => {
  const response = await apiClient.get(`/payment/${id}`);
  return response.data;
};

// ==========================================
// CUSTOMER REVIEW APIs
// ==========================================

export const createReview = async (data: { bookingId: string; rating: number; comment: string }) => {
  const response = await apiClient.post("/reviews", data);
  return response.data;
};

export const getMyReviews = async () => {
  const response = await apiClient.get("/reviews/my-reviews");
  return response.data;
};

export const canReviewBooking = async (bookingId: string) => {
  const response = await apiClient.get(`/reviews/can-review/${bookingId}`);
  return response.data;
};

export const getPartnerReviews = async (partnerId: string) => {
  const response = await apiClient.get(`/reviews/partner/${partnerId}`);
  return response.data;
};

// ==========================================
// PARTNER PROFILE APIs
// ==========================================

export const createPartnerProfile = async (data: { businessName: string; businessAddress: string; cityId: string; servicesOffered: string[]; gstNumber?: string }) => {
  const response = await apiClient.post("/partner/profile", data);
  return response.data;
};

export const getPartnerProfile = async () => {
  const response = await apiClient.get("/partner/profile");
  return response.data;
};

export const updatePartnerProfile = async (data: Partial<{ businessName: string; businessAddress: string; gstNumber: string }>) => {
  const response = await apiClient.patch("/partner/profile", data);
  return response.data;
};

// ==========================================
// PARTNER KYC APIs
// ==========================================

export const uploadKycDocument = async (data: { documentType: string; documentUrl: string }) => {
  const response = await apiClient.post("/partner/kyc", data);
  return response.data;
};

export const getKycDocuments = async () => {
  const response = await apiClient.get("/partner/kyc");
  return response.data;
};

// ==========================================
// PARTNER LEADS & BIDS APIs
// ==========================================

export const getLeads = async (page = 1, limit = 10) => {
  const response = await apiClient.get(`/partner/leads?page=${page}&limit=${limit}`);
  return response.data;
};

export const createBid = async (data: { bookingId: string; quotedAmount: number; estimatedDuration: string; notes?: string }) => {
  const response = await apiClient.post("/partner/bids", data);
  return response.data;
};

export const getPartnerBids = async (status?: string, page = 1, limit = 10) => {
  let url = `/partner/bids?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const withdrawBid = async (id: string) => {
  const response = await apiClient.patch(`/partner/bids/${id}/withdraw`);
  return response.data;
};

// ==========================================
// PARTNER JOBS APIs
// ==========================================

export const getPartnerJobs = async (status?: string, page = 1, limit = 10) => {
  let url = `/partner/jobs?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const startJob = async (id: string) => {
  const response = await apiClient.patch(`/partner/jobs/${id}/start`);
  return response.data;
};

export const completeJob = async (id: string, data?: { finalAmount: number }) => {
  const response = await apiClient.patch(`/partner/jobs/${id}/complete`, data);
  return response.data;
};

export const uploadJobInvoice = async (id: string, data: { invoiceUrl: string }) => {
  const response = await apiClient.post(`/partner/jobs/${id}/invoice`, data);
  return response.data;
};

export const uploadJobPhotos = async (id: string, data: { photos: string[]; type: "before" | "after" }) => {
  const response = await apiClient.post(`/partner/jobs/${id}/photos`, data);
  return response.data;
};

export const issueJobWarranty = async (id: string, data: { warrantyPeriodMonths: number; warrantyDocumentUrl: string }) => {
  const response = await apiClient.post(`/partner/jobs/${id}/warranty`, data);
  return response.data;
};

// ==========================================
// PARTNER EARNINGS APIs
// ==========================================

export const getPartnerEarnings = async (period?: "today" | "week" | "month") => {
  let url = "/partner/earnings";
  if (period) url += `?period=${period}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getEarningsSummary = async () => {
  const response = await apiClient.get("/partner/earnings/summary");
  return response.data;
};

// ==========================================
// EXECUTIVE LEADS APIs
// ==========================================

export const getExecutiveLeads = async (page = 1, limit = 10, otherFilters = "") => {
  const response = await apiClient.get(`/executive/leads?page=${page}&limit=${limit}${otherFilters ? `&${otherFilters}` : ""}`);
  return response.data;
};

export const getExecutiveLeadById = async (id: string) => {
  const response = await apiClient.get(`/executive/leads/${id}`);
  return response.data;
};

export const assignLeadToPartner = async (id: string, data: { partnerId: string; notes?: string }) => {
  const response = await apiClient.patch(`/executive/leads/${id}/assign-partner`, data);
  return response.data;
};

// ==========================================
// EXECUTIVE FOLLOW-UPS APIs
// ==========================================

export const createFollowUp = async (data: { relatedTo: string; relatedUserId: string; bookingId?: string; callOutcome: string; notes?: string; followUpDate?: string }) => {
  const response = await apiClient.post("/executive/follow-ups", data);
  return response.data;
};

export const getFollowUps = async (page = 1, limit = 10, otherFilters = "") => {
  const response = await apiClient.get(`/executive/follow-ups?page=${page}&limit=${limit}${otherFilters ? `&${otherFilters}` : ""}`);
  return response.data;
};

export const getPendingFollowUps = async (page = 1, limit = 10) => {
  const response = await apiClient.get(`/executive/follow-ups/pending?page=${page}&limit=${limit}`);
  return response.data;
};

export const updateFollowUp = async (id: string, data: Partial<{ callOutcome: string; notes: string; followUpDate: string }>) => {
  const response = await apiClient.patch(`/executive/follow-ups/${id}`, data);
  return response.data;
};

// ==========================================
// EXECUTIVE ESCALATIONS APIs
// ==========================================

export const createEscalation = async (data: { bookingId?: string; ticketId?: string; raisedBy: string; relatedUserId?: string; severity: string; description: string }) => {
  const response = await apiClient.post("/executive/escalations", data);
  return response.data;
};

export const getEscalations = async (page = 1, limit = 10, otherFilters = "") => {
  const response = await apiClient.get(`/executive/escalations?page=${page}&limit=${limit}${otherFilters ? `&${otherFilters}` : ""}`);
  return response.data;
};

export const getEscalationById = async (id: string) => {
  const response = await apiClient.get(`/executive/escalations/${id}`);
  return response.data;
};

export const assignEscalationToSelf = async (id: string) => {
  const response = await apiClient.patch(`/executive/escalations/${id}/assign-self`);
  return response.data;
};

export const resolveEscalation = async (id: string, data: { resolutionNotes: string }) => {
  const response = await apiClient.patch(`/executive/escalations/${id}/resolve`, data);
  return response.data;
};

// ==========================================
// EXECUTIVE STATUS APIs
// ==========================================

export const getCustomerStatus = async (page = 1, limit = 10) => {
  const response = await apiClient.get(`/executive/customer-status?page=${page}&limit=${limit}`);
  return response.data;
};

export const getPartnerStatus = async (page = 1, limit = 10) => {
  const response = await apiClient.get(`/executive/partner-status?page=${page}&limit=${limit}`);
  return response.data;
};

// ==========================================
// ACCOUNTS REFUNDS APIs
// ==========================================

export const getAllRefunds = async (page = 1, limit = 10, otherFilters = "") => {
  const response = await apiClient.get(`/accounts/refunds?page=${page}&limit=${limit}${otherFilters ? `&${otherFilters}` : ""}`);
  return response.data;
};

export const initiateRefund = async (data: { bookingId: string; amount: number; reason: string }) => {
  const response = await apiClient.post("/accounts/refunds", data);
  return response.data;
};

export const approveRefund = async (id: string) => {
  const response = await apiClient.patch(`/accounts/refunds/${id}/approve`);
  return response.data;
};

export const processRefund = async (id: string) => {
  const response = await apiClient.patch(`/accounts/refunds/${id}/process`);
  return response.data;
};

export const rejectRefund = async (id: string, data: { rejectionReason: string }) => {
  const response = await apiClient.patch(`/accounts/refunds/${id}/reject`, data);
  return response.data;
};

// ==========================================
// ACCOUNTS SETTLEMENTS APIs
// ==========================================

export const getAllSettlements = async (page = 1, limit = 10, otherFilters = "") => {
  const response = await apiClient.get(`/accounts/settlements?page=${page}&limit=${limit}${otherFilters ? `&${otherFilters}` : ""}`);
  return response.data;
};

export const processSettlement = async (id: string, data: { transactionReference: string }) => {
  const response = await apiClient.patch(`/accounts/settlements/${id}/process`, data);
  return response.data;
};

// ==========================================
// SUPER-ADMIN APIs
// ==========================================

export const getAdminFinanceSummary = async () => {
  const response = await apiClient.get("/super-admin/finance-summary");
  return response.data;
};

export const getAdminRevenue = async (period = "month") => {
  const response = await apiClient.get(`/super-admin/revenue?period=${period}`);
  return response.data;
};

export const getAdminUsers = async (page = 1, limit = 50, role = "") => {
  const response = await apiClient.get(`/super-admin/users?page=${page}&limit=${limit}${role ? `&role=${role}` : ""}`);
  return response.data;
};

export const updateAdminUserStatus = async (id: string, data: { isActive: boolean }) => {
  const response = await apiClient.patch(`/super-admin/users/${id}/status`, data);
  return response.data;
};
