// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Search, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw, Car, User, Store, IndianRupee, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/axios";

export default function ExecutiveExtraWorkPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | "REQUEST_CLARIFICATION">("APPROVE");
  const [reviewNote, setReviewNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchPendingExtraWork = async () => {
    setIsLoading(true);
    setActionError("");
    try {
      const res = await apiClient.get("/executive/extra-work/pending");
      const list = res.data?.items || res.items || res.data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error("Failed to fetch pending extra work:", err);
      setActionError(err.response?.data?.message || "Failed to load pending reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingExtraWork();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if ((reviewAction === "REJECT" || reviewAction === "REQUEST_CLARIFICATION") && !reviewNote.trim()) {
      setActionError("Please provide an executive note/reason for rejection or clarification.");
      return;
    }

    setSubmittingId(selectedItem.extensionId);
    setActionError("");
    setActionSuccess("");

    try {
      await apiClient.patch(`/executive/extra-work/${selectedItem.jobId}/extensions/${selectedItem.extensionId}/review`, {
        action: reviewAction,
        note: reviewNote.trim() || undefined,
      });

      setActionSuccess(`Extra work extension ${reviewAction.toLowerCase()}d successfully.`);
      setSelectedItem(null);
      setReviewNote("");
      // Refresh list
      await fetchPendingExtraWork();
    } catch (err: any) {
      console.error("Review action failed:", err);
      setActionError(err.response?.data?.message || "Failed to submit review action");
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.partName?.toLowerCase().includes(term) ||
      item.bookingRef?.toLowerCase().includes(term) ||
      item.customer?.fullName?.toLowerCase().includes(term) ||
      item.partner?.businessName?.toLowerCase().includes(term) ||
      item.vehicle?.brand?.toLowerCase().includes(term) ||
      item.vehicle?.model?.toLowerCase().includes(term)
    );
  });

  const totalPendingCost = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-7 h-7 text-primary-orange" />
            <span>Extra Work Executive Review</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve partner extra-part requests before they are presented to the customer.
          </p>
        </div>
        <Button
          onClick={fetchPendingExtraWork}
          variant="outline"
          className="flex items-center gap-2 self-start md:self-auto"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-green-500 hover:text-green-800 text-sm font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError("")} className="text-red-500 hover:text-red-800 text-sm font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Approvals</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{items.length}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Value Awaiting Review</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{totalPendingCost.toLocaleString("en-IN")}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <IndianRupee className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Review Role</p>
              <h3 className="text-base font-bold text-gray-900 mt-1">Assigned Executive Gate</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by part name, booking ref, garage, or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Review List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-orange" />
          <p className="text-sm text-gray-500">Loading pending extra-work reviews...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">No Pending Extra Work Reviews</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              All partner extra work requests for your assigned bookings have been reviewed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.extensionId} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300">
                        PENDING EXECUTIVE REVIEW
                      </Badge>
                      <span className="text-xs text-gray-400 font-mono">
                        Booking: #{item.bookingRef || item.bookingId?.slice(-6)?.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {item.partName}
                        <span className="text-primary-orange font-extrabold text-base">
                          ₹{Number(item.cost).toLocaleString("en-IN")}
                        </span>
                      </h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      {item.reason && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">Reason: {item.reason}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{item.partner?.businessName || "Partner Garage"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{item.customer?.fullName || "Customer"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {item.vehicle ? `${item.vehicle.brand || ""} ${item.vehicle.model || ""}` : "Vehicle"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <Button
                      onClick={() => {
                        setSelectedItem(item);
                        setReviewAction("APPROVE");
                        setReviewNote("");
                        setActionError("");
                      }}
                      className="bg-primary-orange hover:bg-orange-600 text-white font-medium px-4 text-sm w-full lg:w-auto"
                    >
                      Review & Decide
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Review Extra Work Request</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  Booking #{selectedItem.bookingRef} • {selectedItem.partName}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="bg-neutral-50 p-3 rounded-lg text-xs space-y-1 text-gray-700">
              <p><strong>Part:</strong> {selectedItem.partName}</p>
              <p><strong>Estimated Cost:</strong> ₹{selectedItem.cost}</p>
              <p><strong>Workshop:</strong> {selectedItem.partner?.businessName}</p>
              <p><strong>Partner Reason:</strong> {selectedItem.reason || "Not specified"}</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction("APPROVE")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                      reviewAction === "APPROVE"
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction("REJECT")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                      reviewAction === "REJECT"
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction("REQUEST_CLARIFICATION")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                      reviewAction === "REQUEST_CLARIFICATION"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Clarification
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Executive Note / Instructions {reviewAction !== "APPROVE" && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={
                    reviewAction === "APPROVE"
                      ? "Optional note for customer or partner..."
                      : "Reason for rejection or what clarification is needed from partner..."
                  }
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedItem(null)}
                  disabled={submittingId !== null}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingId !== null}
                  className={
                    reviewAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : reviewAction === "REJECT"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                  }
                >
                  {submittingId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Processing...
                    </>
                  ) : (
                    `Confirm ${reviewAction === "REQUEST_CLARIFICATION" ? "Clarification" : reviewAction}`
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
