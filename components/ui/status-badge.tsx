import React from "react";
import { Badge } from "@/components/ui/badge";

export type StatusType = 
  | "PENDING" | "QUOTED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  | "NOT_STARTED"
  | "OPEN" | "RESOLVED" | "CLOSED"
  | "SUCCESS" | "FAILED"
  | "ACTIVE" | "EXPIRED" | "VOID"
  | "APPROVED" | "UNDER_REVIEW" | "REJECTED" | "WITHDRAWN"
  | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const getStatusColorTheme = (status: string) => {
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
  if (["PENDING", "QUOTED", "OPEN", "UNDER_REVIEW", "EXPIRED", "MEDIUM", "WITHDRAWN"].includes(s)) {
    return {
      bgClass: "bg-warning hover:bg-warning/90 text-white",
      hex: "#F59E0B"
    };
  }
  
  // PRIMARY themes (Blue)
  if (["IN_PROGRESS", "NOT_STARTED", "LOW"].includes(s)) {
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
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const theme = getStatusColorTheme(status);
  
  return (
    <Badge 
      className={`uppercase text-[10px] tracking-wider border-none ${theme.bgClass} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
