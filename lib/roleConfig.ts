import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  ShieldCheck,
  CreditCard,
  HelpCircle,
  Star,
  Settings,
  Camera,
  GitCompare,
  Home,
  FileText,
  MessageSquareQuote,
  Wrench,
  IndianRupee,
  Calendar,
  Users,
  Activity,
  HeadphonesIcon,
  Target,
  PhoneCall,
  Clock,
  AlertTriangle,
  Briefcase,
  AlertCircle,
  BadgeCheck,
  Gift,
  Package,
  ShoppingCart,
  Users as UsersIcon,
  Truck,
  Undo2,
  FileBarChart,
  Landmark,
  Ticket,
  Store,
  PieChart,
  ClipboardList,
  Key,
  User,
  MapPin,
  Sliders,
  Wallet,
  Receipt
} from "lucide-react";
import { Role } from "@/lib/constants";

export interface NavItem {
  name: string;
  href: string;
  icon: any; // LucideIcon type
  badge?: string;
  badgeColor?: string;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export interface RoleConfigData {
  roleName: string;
  portalTitle: string;
  themeColor: string; // Tailwind text color class
  accentBgColor: string; // Tailwind bg color class
  navSections: NavSection[];
}

export const roleConfig: Record<Role, RoleConfigData> = {
  CUSTOMER: {
    roleName: "Customer",
    portalTitle: "Customer Portal",
    themeColor: "text-secondary-blue",
    accentBgColor: "bg-secondary-blue",
    navSections: [
      {
        label: "Overview",
        items: [
          { name: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        label: "My Services",
        items: [
          { name: "My Garage", href: "/customer/garage", icon: Car },
          { name: "My Bookings", href: "/customer/bookings", icon: CalendarCheck },
          { name: "My Warranties", href: "/customer/warranty", icon: ShieldCheck },
        ],
      },
      {
        label: "Account",
        items: [
          { name: "My Reviews", href: "/customer/reviews", icon: Star },
          { name: "Queries", href: "/customer/support", icon: HelpCircle },
          { name: "Profile", href: "/customer/profile", icon: User },
        ],
      },
    ],
  },
  PARTNER: {
    roleName: "Service Partner",
    portalTitle: "Partner Dashboard",
    themeColor: "text-primary-orange",
    accentBgColor: "bg-primary-orange",
    navSections: [
      {
        label: "Overview",
        items: [
          { name: "Dashboard", href: "/partner/dashboard", icon: Home },
          { name: "My Reviews", href: "/partner/reviews", icon: Star },
        ],
      },
      {
        label: "Leads & Jobs",
        items: [
          { name: "New Leads", href: "/partner/leads", icon: Target },
          { name: "My Bids", href: "/partner/bids", icon: MessageSquareQuote },
          { name: "Active Jobs", href: "/partner/jobs", icon: Wrench },
        ],
      },
      {
        label: "Management",
        items: [
          { name: "My Wallet", href: "/partner/wallet", icon: Wallet },
          { name: "Staff / Mechanics", href: "/partner/staff", icon: Users },
          { name: "Inventory & POS", href: "/partner/inventory", icon: Package },
          { name: "Earnings & Settlements", href: "/partner/earnings", icon: IndianRupee },
          { name: "KYC & Profile", href: "/partner/profile", icon: ShieldCheck },
        ],
      },
    ],
  },
  EXECUTIVE: {
    roleName: "Operations Executive",
    portalTitle: "Executive Console",
    themeColor: "text-blue-400",
    accentBgColor: "bg-blue-400",
    navSections: [
      {
        label: "Overview",
        items: [
          { name: "Dashboard", href: "/executive/dashboard", icon: LayoutDashboard },
          { name: "Customer Status", href: "/executive/customer-status", icon: Users },
          { name: "Partner Status", href: "/executive/partner-status", icon: Briefcase },
        ],
      },
      {
        label: "Operations",
        items: [
          { name: "Website Leads", href: "/executive/website-leads", icon: Target },
          { name: "Leads / Assignments", href: "/executive/leads", icon: Target },
          { name: "Invoices & Bills", href: "/executive/invoices", icon: Receipt },
          { name: "Helpdesk", href: "/executive/helpdesk", icon: HelpCircle },
          { name: "Follow-Ups", href: "/executive/follow-ups", icon: PhoneCall },
          { name: "Logistics", href: "/executive/logistics", icon: Car },
          { name: "History", href: "/executive/history", icon: Clock },
        ],
      },
    ],
  },
  ACCOUNTS: {
    roleName: "Accounts",
    portalTitle: "Financial Dashboard",
    themeColor: "text-blue-400",
    accentBgColor: "bg-blue-400",
    navSections: [
      {
        label: "Overview",
        items: [
          { name: "Financial Dashboard", href: "/accounts/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        label: "Finance",
        items: [
          { name: "Transactions", href: "/accounts/transactions", icon: CreditCard },
          { name: "Partner Settlements", href: "/accounts/settlements", icon: Landmark },
          { name: "Executive Payouts", href: "/accounts/payouts", icon: IndianRupee },
          { name: "Invoices", href: "/accounts/invoices", icon: FileText },
        ],
      },
      {
        label: "Analytics",
        items: [
          { name: "Reports", href: "/accounts/reports", icon: FileBarChart },
        ],
      },
    ],
  },
  SUPER_ADMIN: {
    roleName: "Super Admin",
    portalTitle: "Master Dashboard",
    themeColor: "text-primary-orange",
    accentBgColor: "bg-primary-orange",
    navSections: [
      {
        label: "Overview",
        items: [
          { name: "Master Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        label: "Management",
        items: [
          { name: "User Management", href: "/admin/users", icon: UsersIcon },
          { name: "Verifications (KYC)", href: "/admin/kyc", icon: ShieldCheck },
          { name: "Master Data", href: "/admin/master-data", icon: Settings },
        ],
      },
      {
        label: "Monitoring",
        items: [
          { name: "Global Booking Oversight", href: "/admin/bookings", icon: Activity },
          { name: "Dispute & Support", href: "/admin/support", icon: HelpCircle },
          { name: "Platform Settings", href: "/admin/platform-settings", icon: Sliders },
        ],
      },
    ],
  },
};
