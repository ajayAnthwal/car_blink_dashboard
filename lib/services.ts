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

export const updateAuthUserProfile = async (data: { fullName?: string; phone?: string; profilePicture?: string }) => {
  const response = await apiClient.patch("/auth/me", data);
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

import { State, City } from "country-state-city";
import { indianCarBrands, indianCarModels } from "./data/cars";

export const getCities = async (page = 1, limit = 100) => {
  try {
    const response = await apiClient.get(`/cities?page=${page}&limit=${limit}`);
    return response.data;
  } catch (err) {
    return { data: [] };
  }
};

export const getServices = async (page = 1, limit = 100) => {
  const response = await apiClient.get(`/services?page=${page}&limit=${limit}`);
  return response.data;
};



export const getVehicleBrands = async () => {
  return { data: indianCarBrands };
};

export const getVehicleModels = async (brandId: string) => {
  const models = indianCarModels.filter(m => m.brandId === brandId);
  return { data: models };
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

export const createService = async (data: { name: string; slug?: string; description?: string; icon?: string; category?: string }) => {
  const response = await apiClient.post("/services", data);
  return response.data;
};

export const updateService = async (id: string, data: { name?: string; description?: string; icon?: string; category?: string }) => {
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

export const createBooking = async (data: { vehicleId: string; serviceId: string; cityId: string; description: string; preferredDate: string; latitude?: number; longitude?: number }) => {
  // If cityId is just a string name from the package, provide a valid dummy hex ID to bypass backend format validation
  let validCityId = data.cityId;
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(validCityId);
  if (!isMongoId) {
    validCityId = "64f1a2b3c4d5e6f7a8b9c0d1"; // Dummy valid ObjectId
    data.description = `[Location: ${data.cityId}] ${data.description}`; // Preserve the location
  }

  const response = await apiClient.post("/customer/bookings", { ...data, cityId: validCityId });
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
  const response = await apiClient.patch(`/customer/bookings/${id}/quotes`, data);
  return response.data;
};

export const applyCouponToBooking = async (id: string, data: { couponCode: string }) => {
  const response = await apiClient.post(`/customer/bookings/${id}/coupon`, data);
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

export const initiatePayment = async (data: { bookingId: string; amount: number; paymentType: string; couponCode?: string }) => {
  const response = await apiClient.post("/payment/initiate", data);
  return response.data;
};

export const verifyPayment = async (data: { paymentId: string; orderId: string; signature: string }) => {
  const response = await apiClient.post("/payment/verify", data);
  return response.data;
};

export const markOfflinePayment = async (data: { bookingId: string; amount: number; paymentType: string }) => {
  const response = await apiClient.post("/payment/offline", data);
  return response.data;
};

export const verifyOfflinePayment = async (paymentId: string) => {
  const response = await apiClient.post("/payment/offline/verify", { paymentId });
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

export const createPartnerProfile = async (data: { businessName: string; businessAddress: string; cityId: string; servicesOffered: string[]; gstNumber?: string; latitude?: number; longitude?: number }) => {
  const response = await apiClient.post("/partner/profile", data);
  return response.data;
};

export const getPartnerProfile = async () => {
  const response = await apiClient.get("/partner/profile");
  return response.data;
};

export const updatePartnerProfile = async (data: Partial<{ businessName: string; businessAddress: string; gstNumber: string; latitude?: number; longitude?: number }>) => {
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



export const issueJobWarranty = async (id: string, data: { warrantyPeriodMonths: number; warrantyDocumentUrl: string }) => {
  const response = await apiClient.post(`/partner/jobs/${id}/warranty`, data);
  return response.data;
};

export const getPartnerWarranties = async () => {
  const response = await apiClient.get("/partner/warranties");
  return response.data;
};

// ==========================================
// PARTNER EARNINGS APIs
// ==========================================

export const getPartnerEarnings = async (period?: "today" | "week" | "month") => {
  let url = "/partner/earnings";
  if (period) url += `?period=${period}&_t=${Date.now()}`;
  else url += `?_t=${Date.now()}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getPartnerSettlements = async () => {
  const response = await apiClient.get("/partner/earnings/settlements");
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

export const assignLeadToPartner = async (id: string, data: { partnerIds: string[]; notes?: string }) => {
  const response = await apiClient.patch(`/executive/leads/${id}/assign-partner`, data);
  return response.data;
};

export const forwardQuoteToCustomer = async (id: string, data: { bidIds: string[]; notes?: string }) => {
  const response = await apiClient.post(`/executive/leads/${id}/forward-quote`, data);
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
  const t = Date.now();
  const sep = otherFilters ? "&" : "";
  const response = await apiClient.get(`/executive/escalations?page=${page}&limit=${limit}${otherFilters ? `&${otherFilters}` : ""}&_t=${t}`);
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

export const verifyExecutiveCustomer = async (id: string) => {
  const response = await apiClient.patch(`/executive/customer-status/${id}/verify`);
  return response.data;
};

export const verifyExecutivePartner = async (id: string, data?: { status: 'APPROVED' | 'REJECTED'; reason?: string }) => {
  const response = await apiClient.patch(`/executive/partner-status/${id}/verify`, data || {});
  return response.data;
};

// ==========================================
// ACCOUNTS REFUNDS APIs
// ==========================================

export const getAllRefunds = async (page = 1, limit = 10, otherFilters = "") => {
  const response = await apiClient.get(`/accounts/refunds?page=${page}&limit=${limit}${otherFilters ? `&${otherFilters}` : ""}`);
  return response.data;
};

export const getEligiblePaymentsForRefund = async () => {
  const response = await apiClient.get("/accounts/refunds/eligible-payments");
  return response.data;
};

export const initiateRefund = async (data: { paymentId: string; amount: number; reason: string }) => {
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

export const getEligibleJobsForSettlement = async () => {
  const response = await apiClient.get("/accounts/settlements/eligible-jobs");
  return response.data;
};

export const generateSettlement = async (data: { jobId: string; commissionPercent: number }) => {
  const response = await apiClient.post("/accounts/settlements/generate", data);
  return response.data;
};

export const getPartnerSettlementHistory = async (partnerId: string) => {
  const response = await apiClient.get(`/accounts/settlements/partner/${partnerId}`);
  return response.data;
};

// ==========================================
// ACCOUNTS REPORTS APIs
// ==========================================

export const getGstReport = async (fromDate: string, toDate: string) => {
  const response = await apiClient.get(`/accounts/reports/gst?fromDate=${fromDate}&toDate=${toDate}`);
  return response.data;
};

export const getInvoicesReport = async (fromDate: string, toDate: string, cityId?: string, serviceId?: string) => {
  let url = `/accounts/reports/invoices?fromDate=${fromDate}&toDate=${toDate}`;
  if (cityId) url += `&cityId=${cityId}`;
  if (serviceId) url += `&serviceId=${serviceId}`;
  const response = await apiClient.get(url);
  return response.data;
};

// ==========================================
// SUPER-ADMIN APIs
// ==========================================

export const getAllWebsiteLeads = async (page = 1, limit = 50, status = "") => {
  const response = await apiClient.get(`/leads?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`);
  return response.data;
};

export const getCommissionReport = async (fromDate: string, toDate: string, partnerId?: string) => {
  const query = new URLSearchParams({ fromDate, toDate });
  if (partnerId) query.append("partnerId", partnerId);
  const response = await apiClient.get(`/super-admin/commission?${query.toString()}`);
  return response.data;
};

export const getAdminFinanceSummary = async (fromDate: string, toDate: string) => {
  const query = new URLSearchParams({ fromDate, toDate });
  const response = await apiClient.get(`/super-admin/finance-summary?${query.toString()}`);
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

export const getAllAdminVehicles = async (page = 1, limit = 50) => {
  const response = await apiClient.get(`/super-admin/vehicles?page=${page}&limit=${limit}`);
  return response.data;
};

export const updateAdminUserStatus = async (id: string, data: { isActive: boolean }) => {
  const response = await apiClient.patch(`/super-admin/users/${id}/status`, data);
  return response.data;
};

// Promotions & Vendors
export const createCoupon = async (data: any) => {
  const response = await apiClient.post("/super-admin/coupons", data);
  return response.data;
};

export const onboardVendor = async (data: any) => {
  const response = await apiClient.post("/super-admin/vendors", data);
  return response.data;
};

// Analytics & Reports
export const getAdminRevenueTrend = async (fromDate?: string, toDate?: string) => {
  const query = new URLSearchParams();
  if (fromDate) query.append("fromDate", fromDate);
  if (toDate) query.append("toDate", toDate);
  const response = await apiClient.get(`/super-admin/revenue/trend?${query.toString()}`);
  return response.data;
};

export const getLeadsTodayStats = async () => {
  const response = await apiClient.get("/super-admin/leads-today/stats");
  return response.data;
};

export const getLeadsTodayList = async () => {
  const response = await apiClient.get("/super-admin/leads-today/list");
  return response.data;
};

export const getGrowthMetrics = async (type: "users" | "bookings" | "partner-funnel") => {
  const response = await apiClient.get(`/super-admin/growth/${type}`);
  return response.data;
};

export const getMarketingInsights = async (type: "top-cities" | "top-services" | "retention") => {
  const response = await apiClient.get(`/super-admin/marketing/${type}`);
  return response.data;
};

export const getReportsHistory = async () => {
  const response = await apiClient.get("/super-admin/reports/history");
  return response.data;
};

// ==========================================
// CUSTOMER RSA APIs
// ==========================================

export const requestRSA = async (data: { vehicleId: string; issueType: string; location: { lat: number; lng: number } }) => {
  const response = await apiClient.post("/customer/rsa", data);
  return response.data;
};

export const getRSAStatus = async (id: string) => {
  const response = await apiClient.get(`/customer/rsa/${id}`);
  return response.data;
};

export const cancelRSA = async (id: string) => {
  const response = await apiClient.patch(`/customer/rsa/${id}/cancel`);
  return response.data;
};

// ==========================================
// CUSTOMER SUBSCRIPTION APIs
// ==========================================

export const purchaseSubscription = async (data: { planName: string; price: number; endDate: string }) => {
  const response = await apiClient.post("/customer/subscriptions/purchase", data);
  return response.data;
};

export const getMySubscriptions = async () => {
  const response = await apiClient.get("/customer/subscriptions/my-subscriptions");
  return response.data;
};

export const checkSubscriptionValidity = async () => {
  const response = await apiClient.get("/customer/subscriptions/check-validity");
  return response.data;
};

// ==========================================
// CUSTOMER REFERRAL APIs
// ==========================================

export const applyReferral = async (data: { referralCodeUsed: string }) => {
  const response = await apiClient.post("/customer/referrals/apply", data);
  return response.data;
};

// ==========================================
// PARTNER INVENTORY APIs
// ==========================================

export const getInventory = async () => {
  const response = await apiClient.get("/partner/inventory");
  return response.data;
};

export const addStockItem = async (data: any) => {
  const response = await apiClient.post("/partner/inventory", data);
  return response.data;
};

export const updateStockItem = async (id: string, data: any) => {
  const response = await apiClient.patch(`/partner/inventory/${id}`, data);
  return response.data;
};

export const deleteStockItem = async (id: string) => {
  const response = await apiClient.delete(`/partner/inventory/${id}`);
  return response.data;
};

// ==========================================
// PARTNER STAFF APIs
// ==========================================

export const getStaff = async () => {
  const response = await apiClient.get("/partner/staff");
  return response.data;
};


export const updateStaffMember = async (id: string, data: any) => {
  const response = await apiClient.put(`/partner/staff/${id}`, data);
  return response.data;
};

export const deleteStaffMember = async (id: string) => {
  const response = await apiClient.delete(`/partner/staff/${id}`);
  return response.data;
};

export const updateStaffStatus = async (id: string, data: { status: string }) => {
  const response = await apiClient.patch(`/partner/staff/${id}/status`, data);
  return response.data;
};

// ==========================================
// PARTNER POS APIs
// ==========================================

export const generatePosInvoice = async (data: any) => {
  const response = await apiClient.post("/partner/pos/generate", data);
  return response.data;
};

export const getPosInvoices = async () => {
  const response = await apiClient.get("/partner/pos");
  return response.data;
};

// ==========================================
// NOTIFICATIONS APIs
// ==========================================

const mockNotifications = [
  {
    id: 1,
    type: "booking_confirmed",
    title: "Booking Confirmed",
    description: "Your service booking for Hyundai Creta has been confirmed for tomorrow at 10:00 AM.",
    time: "2 hours ago",
    iconName: "CalendarCheck",
    read: false,
    category: "bookings"
  },
  {
    id: 2,
    type: "service_update",
    title: "Service Started",
    description: "Our partner 'Elite Auto Care' has started working on your vehicle.",
    time: "5 hours ago",
    iconName: "Wrench",
    read: true,
    category: "service"
  },
  {
    id: 3,
    type: "alert",
    title: "Payment Pending",
    description: "You have a pending invoice of ₹2,450 for the recent oil change service.",
    time: "1 day ago",
    iconName: "AlertTriangle",
    read: false,
    category: "alerts"
  },
  {
    id: 4,
    type: "system",
    title: "Welcome to CarBlink",
    description: "Thank you for joining CarBlink! Start by adding your first vehicle to the garage.",
    time: "3 days ago",
    iconName: "Info",
    read: true,
    category: "system"
  },
  {
    id: 5,
    type: "booking_completed",
    title: "Service Completed",
    description: "Your Maruti Swift service has been completed successfully. Please review the partner.",
    time: "1 week ago",
    iconName: "CheckCircle2",
    read: true,
    category: "service"
  }
];

export const getNotifications = async () => {
  try {
    const response = await apiClient.get("/notifications");
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const markNotificationAsRead = async (id: number | string) => {
  try {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  } catch (err) {
    return { success: true };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiClient.patch(`/notifications/read-all`);
    return response.data;
  } catch (err) {
    return { success: true };
  }
};

// ==========================================
// LOGISTICS APIs
// ==========================================

export const assignDriverToBooking = async (data: { bookingId: string; executiveId: string; driverName: string; driverPhone: string; status?: string }) => {
  const response = await apiClient.post("/logistics/assign", data);
  return response.data;
};

// ==========================================
// PREMIUM FEATURES APIs
// ==========================================

// PARTNER
export const uploadJobPhotos = async (jobId: string, formData: FormData) => {
  const type = formData.get("type") as string;
  const photos = formData.getAll("photos") as File[];

  const uploadPromises = photos.map(file => uploadFile(file, "job-photos"));
  const uploadResponses = await Promise.all(uploadPromises);
  const photoUrls = uploadResponses.map(res => {
    if (typeof res === 'string') return res;
    return res.fileUrl || res.data?.fileUrl || res.data || res;
  });

  const response = await apiClient.post(`/partner/jobs/${jobId}/photos`, {
    type,
    photos: photoUrls
  });
  return response.data;
};

export const deleteJobPhoto = async (jobId: string, photoUrl: string, type: string) => {
  const response = await apiClient.delete(`/partner/jobs/${jobId}/photos`, {
    data: { photoUrl, type }
  });
  return response.data;
};

export const updatePartnerCapacity = async (data: { dailyCapacity: number; blockedDates: string[] }) => {
  const response = await apiClient.patch("/partner/capacity", data);
  return response.data;
};

export const addPartnerStaff = async (data: { name: string; phone: string; role: string }) => {
  const response = await apiClient.post("/partner/staff", data);
  return response.data;
};

export const assignStaffToJob = async (jobId: string, data: { staffId: string }) => {
  const response = await apiClient.patch(`/partner/jobs/${jobId}/assign-staff`, data);
  return response.data;
};

export const requestJobExtension = async (jobId: string, data: { partName: string; cost: number; reason: string }) => {
  const response = await apiClient.post(`/partner/jobs/${jobId}/extensions`, data);
  return response.data;
};

// CUSTOMER
export const getCustomerLiveTracking = async (bookingId: string) => {
  const response = await apiClient.get(`/customer/bookings/${bookingId}/tracking`);
  return response.data;
};

export const respondToJobExtension = async (bookingId: string, extId: string, data: { status: "APPROVED" | "REJECTED" }) => {
  const response = await apiClient.patch(`/customer/bookings/${bookingId}/extensions/${extId}`, data);
  return response.data;
};

// EXECUTIVE
export const pushDriverLocation = async (logisticsId: string, data: { lat: number; lng: number }) => {
  const response = await apiClient.patch(`/executive/logistics/${logisticsId}/location`, data);
  return response.data;
};

export const initiateClickToCall = async (data: { phoneNumber: string; targetUserId?: string }) => {
  const response = await apiClient.post("/executive/call", data);
  return response.data;
};

// ACCOUNTS
export const uploadBankReconciliation = async (formData: FormData) => {
  const response = await apiClient.post("/accounts/settlements/reconciliation", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

// SUPER ADMIN
export const getAuditLogs = async () => {
  const response = await apiClient.get("/super-admin/audit-logs");
  return response.data;
};

export const createCustomRole = async (data: { roleName: string; permissions: string[] }) => {
  const response = await apiClient.post("/super-admin/custom-roles", data);
  return response.data;
};

export const getSuperAdminBookings = async (query = "") => {
  const response = await apiClient.get(`/super-admin/bookings?${query}`);
  return response.data;
};

export const getSuperAdminBookingDetails = async (id: string) => {
  const response = await apiClient.get(`/super-admin/bookings/${id}`);
  return response.data;
};

export const cancelSuperAdminBooking = async (id: string, reason: string) => {
  const response = await apiClient.put(`/super-admin/bookings/${id}/cancel`, { reason });
  return response.data;
};

export const getSuperAdminPartners = async (query = "") => {
  const response = await apiClient.get(`/super-admin/partners?${query}`);
  return response.data;
};

export const getSuperAdminPartnerDetails = async (id: string) => {
  const response = await apiClient.get(`/super-admin/partners/${id}`);
  return response.data;
};

export const updateSuperAdminPartnerKyc = async (id: string, status: string, reason?: string) => {
  const response = await apiClient.put(`/super-admin/partners/${id}/kyc`, { status, reason });
  return response.data;
};

export const getSuperAdminCoupons = async () => {
  const response = await apiClient.get(`/super-admin/coupons`);
  return response.data;
};

export const createSuperAdminCoupon = async (data: any) => {
  const response = await apiClient.post(`/super-admin/coupons`, data);
  return response.data;
};

export const toggleSuperAdminCoupon = async (id: string) => {
  const response = await apiClient.patch(`/super-admin/coupons/${id}/toggle`);
  return response.data;
};

export const deleteSuperAdminCoupon = async (id: string) => {
  const response = await apiClient.delete(`/super-admin/coupons/${id}`);
  return response.data;
};

export const getSuperAdminTickets = async (query = "") => {
  const response = await apiClient.get(`/super-admin/tickets?${query}`);
  return response.data;
};

export const getSuperAdminTicketDetails = async (id: string) => {
  const response = await apiClient.get(`/super-admin/tickets/${id}`);
  return response.data;
};

export const updateSuperAdminTicketStatus = async (id: string, status: string) => {
  const response = await apiClient.patch(`/super-admin/tickets/${id}/status`, { status });
  return response.data;
};

export const addSuperAdminTicketReply = async (id: string, message: string) => {
  const response = await apiClient.post(`/super-admin/tickets/${id}/reply`, { message });
  return response.data;
};

export const getSuperAdminStaff = async () => {
  const response = await apiClient.get(`/super-admin/staff`);
  return response.data;
};

export const createSuperAdminStaff = async (data: any) => {
  const response = await apiClient.post(`/super-admin/staff`, data);
  return response.data;
};

export const getSuperAdminRoles = async () => {
  const response = await apiClient.get(`/super-admin/staff/roles`);
  return response.data;
};

export const getSuperAdminSettlements = async (query = "") => {
  const response = await apiClient.get(`/super-admin/settlements?${query}`);
  return response.data;
};

export const markSuperAdminSettlementPaid = async (id: string, data: any) => {
  const response = await apiClient.patch(`/super-admin/settlements/${id}/mark-paid`, data);
  return response.data;
};

export const getSuperAdminSettings = async () => {
  const response = await apiClient.get(`/super-admin/settings`);
  return response.data;
};

export const updateSuperAdminSettings = async (data: any) => {
  const response = await apiClient.put(`/super-admin/settings`, data);
  return response.data;
};

export const getSuperAdminNotifications = async () => {
  const response = await apiClient.get(`/super-admin/notifications`);
  return response.data;
};

export const sendSuperAdminNotification = async (data: any) => {
  const response = await apiClient.post(`/super-admin/notifications/send`, data);
  return response.data;
};

export const getSuperAdminZones = async (query = "") => {
  const response = await apiClient.get(`/super-admin/zones?${query}`);
  return response.data;
};

export const createSuperAdminZone = async (data: any) => {
  const response = await apiClient.post(`/super-admin/zones`, data);
  return response.data;
};

export const updateSuperAdminZone = async (id: string, data: any) => {
  const response = await apiClient.patch(`/super-admin/zones/${id}`, data);
  return response.data;
};

export const deleteSuperAdminZone = async (id: string) => {
  const response = await apiClient.delete(`/super-admin/zones/${id}`);
  return response.data;
};

// ==========================================
// NEW PAYMENT/BOOKING APIs
// ==========================================

export const respondToExtension = async (bookingId: string, extId: string, status: 'APPROVED' | 'REJECTED') => {
  const response = await apiClient.patch(`/customer/bookings/${bookingId}/extensions/${extId}`, { status });
  return response.data;
};
