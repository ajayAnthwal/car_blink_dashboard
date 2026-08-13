export interface User {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  _id: string;
  id?: string;
  brand: string;
  model: string;
  registrationNumber: string;
  fuelType: string;
  year: number;
}

export interface Service {
  _id: string;
  id?: string;
  name: string;
  icon?: string;
  category?: string;
}

export interface City {
  _id: string;
  id?: string;
  name: string;
  state: string;
}

export interface Booking {
  _id: string;
  id?: string;
  customerId: string | User;
  vehicleId: string | Vehicle;
  serviceId: string | Service;
  cityId: string | City;
  description: string;
  preferredDate: string;
  status: "PENDING" | "QUOTED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedPartnerId?: any;
  assignedExecutiveId?: any;
  serviceMode?: 'DOORSTEP' | 'GARAGE_VISIT';
  paymentMode?: 'CASH' | 'ONLINE';
  address?: string;
  landmark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  id?: string;
  bookingId: string | Booking;
  customerId: string | User;
  amount: number;
  paymentType: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  paidAt?: string;
  createdAt: string;
}

export interface Warranty {
  _id: string;
  id?: string;
  bookingId: string | Booking;
  warrantyPeriodMonths: number;
  status: "ACTIVE" | "EXPIRED" | "VOID";
  expiresAt: string;
  createdAt: string;
}

export interface PartnerProfile {
  _id: string;
  id?: string;
  userId: string | User;
  businessName: string;
  businessAddress: string;
  rating?: number;
  totalReviews?: number;
  verificationStatus: "APPROVED" | "PENDING" | "UNDER_REVIEW" | "REJECTED";
}

export interface Job {
  _id: string;
  id?: string;
  partnerId: string;
  bookingId: string | Booking;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  finalAmount?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  _id: string;
  id?: string;
  customerId: string | User;
  serviceId: string | Service;
  cityId: string | City;
  vehicleId: string | Vehicle;
  description: string;
  status: "PENDING" | "QUOTED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

export interface Bid {
  _id: string;
  id?: string;
  partnerId: string;
  bookingId: string | Booking;
  quotedAmount: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
}

export interface Escalation {
  _id: string;
  id?: string;
  bookingId?: string | Booking;
  ticketId?: string;
  raisedBy: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  description: string;
  createdAt: string;
}

export interface FollowUp {
  _id: string;
  id?: string;
  relatedTo: "CUSTOMER" | "PARTNER";
  relatedUserId: string | User;
  bookingId?: string | Booking;
  status: "PENDING" | "COMPLETED";
  followUpDate: string;
  createdAt: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  completedJobs: number;
  pendingPayments: number;
  monthlyTrend: {
    month: string;
    amount: number;
  }[];
}
