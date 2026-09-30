import React from "react";
import { Badge } from "@/components/ui/badge";

export type StatusType = 
  | "PENDING" | "QUOTED" | "CUSTOMER_ACCEPTED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  | "NOT_STARTED"
  | "OPEN" | "RESOLVED" | "CLOSED"
  | "SUCCESS" | "FAILED"
  | "ACTIVE" | "EXPIRED" | "VOID"
  | "APPROVED" | "UNDER_REVIEW" | "REJECTED" | "WITHDRAWN"
  | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const getStatusColorTheme = (status: string | undefined | null) => {
  if (!status) {
    return {
      bgClass: "bg-gray-500 hover:bg-gray-600 text-white",
      hex: "#6B7280"
    };
  }

  const s = status.toUpperCase();
  
  // SUCCESS themes (Green)
  if (["COMPLETED", "RESOLVED", "SUCCESS", "ACTIVE", "APPROVED", "ACCEPTED"].includes(s)) {
    return {
      bgClass: "bg-success hover:bg-success/90 text-white",
      hex: "#16A34A" // Custom tailwind success color
    };
  }
  
  // DANGER themes (Red)
  if (["CANCELLED", "FAILED", "VOID", "REJECTED", "CRITICAL", "HIGH"].includes(s)) {
    return {
      bgClass: "bg-danger hover:bg-danger/90 text-white",
      hex: "#DC2626"
    };
  }
  
  // WARNING themes (Orange/Yellow)
  if (["PENDING", "QUOTED", "CUSTOMER_ACCEPTED", "OPEN", "UNDER_REVIEW", "EXPIRED", "MEDIUM", "WITHDRAWN", "NOT_STARTED", "READY_TO_START"].includes(s)) {
    return {
      bgClass: "bg-warning hover:bg-warning/90 text-white",
      hex: "#F59E0B"
    };
  }
  
  // PRIMARY themes (Blue)
  if (["IN_PROGRESS", "LOW"].includes(s)) {
    return {
      bgClass: "bg-secondary-blue hover:bg-secondary-blue/90 text-white",
      hex: "#2563EB"
    };
  }
  
  // Fallback
  return {
    bgClass: "bg-gray-500 hover:bg-gray-600 text-white",
    hex: "#6B7280"
  };
};

interface StatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const safeStatus = status || "UNKNOWN";
  
  if (safeStatus.toUpperCase() === 'CUSTOMER_ACCEPTED' || safeStatus.toUpperCase() === 'AWAITING_15_PERCENT_ADVANCE') {
    return (
      <Badge 
        className={`uppercase text-[10px] font-extrabold tracking-wider border-amber-300 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-0.5 shadow-2xs ${className}`}
      >
        AWAITING ADVANCE PAYMENT ⏳
      </Badge>
    );
  }

  if (safeStatus.toUpperCase() === 'NOT_STARTED' || safeStatus.toUpperCase() === 'READY_TO_START') {
    return (
      <Badge 
        className={`uppercase text-[10px] font-extrabold tracking-wider border-amber-300 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-0.5 shadow-2xs ${className}`}
      >
        READY TO START ⏳
      </Badge>
    );
  }

  const theme = getStatusColorTheme(safeStatus);
  
  return (
    <Badge 
      className={`uppercase text-[10px] tracking-wider border-none ${theme.bgClass} ${className}`}
    >
      {safeStatus.replace(/_/g, " ")}
    </Badge>
  );
}
