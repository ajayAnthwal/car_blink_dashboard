// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FileText, 
  Printer, 
  X, 
  CheckCircle2, 
  Car, 
  Calendar, 
  Wrench, 
  Building2 
} from "lucide-react";
import { useCustomerWarranties } from "@/features/customer/hooks/useCustomerQueries";

export default function WarrantiesPage() {
  const { data: warrantiesData, isLoading } = useCustomerWarranties();
  const warranties = (warrantiesData?.warranties || []) as any[];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const filteredWarranties = warranties.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const serviceName = w.bookingId?.serviceId?.name || "";
    const brand = w.bookingId?.vehicleId?.brand || "";
    const model = w.bookingId?.vehicleId?.model || "";
    const partnerName = w.partnerId?.businessName || "";
    const status = w.status || "";

    return (
      serviceName.toLowerCase().includes(q) ||
      brand.toLowerCase().includes(q) ||
      model.toLowerCase().includes(q) ||
      partnerName.toLowerCase().includes(q) ||
      status.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredWarranties.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredWarranties.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedWarranties = filteredWarranties.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "EXPIRED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "CLAIMED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handlePrintCertificate = () => {
    if (!selectedCertificate) return;
    const printContent = document.getElementById("warranty-certificate-printable");
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CarBlink Warranty Certificate - ${selectedCertificate._id}</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 15mm; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0F172A; background: #fff; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0F172A; background: #f8fafc; padding: 20px; }
            .cert-box { max-width: 800px; margin: 0 auto; background: #fff; border: 10px solid #0F172A; border-radius: 16px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; }
            .cert-header { text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 24px; margin-bottom: 30px; }
            .cert-logo { font-size: 28px; font-weight: 900; color: #EA580C; tracking-tight; }
            .cert-title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #0F172A; margin-top: 8px; }
            .cert-number { font-size: 13px; color: #64748B; margin-top: 4px; font-weight: 600; }
            .grid-table { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
            .field-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; }
            .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B; margin-bottom: 4px; }
            .field-val { font-size: 15px; font-weight: 800; color: #0F172A; }
            .badge-active { display: inline-block; background: #DCFCE7; color: #166534; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 99px; }
            .cert-footer { border-top: 2px solid #E2E8F0; padding-top: 24px; text-align: center; font-size: 12px; color: #64748B; margin-top: 30px; }
            .seal-stamp { text-align: right; margin-top: 20px; font-weight: 800; color: #EA580C; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="cert-box">
            <div class="cert-header">
              <div class="cert-logo">CARBLINK</div>
              <div class="cert-title">Official Service Warranty Certificate</div>
              <div class="cert-number">Certificate ID: CB-WRN-${(selectedCertificate._id || "").slice(-8).toUpperCase()}</div>
            </div>

            <div class="grid-table">
              <div class="field-card">
                <div class="field-label">Service Covered</div>
                <div class="field-val">${selectedCertificate.bookingId?.serviceId?.name || "Full Car Service"}</div>
              </div>
              <div class="field-card">
                <div class="field-label">Warranty Status</div>
                <div class="field-val"><span class="badge-active">${selectedCertificate.status || "ACTIVE"}</span></div>
              </div>
              <div class="field-card">
                <div class="field-label">Vehicle Details</div>
                <div class="field-val">${selectedCertificate.bookingId?.vehicleId?.brand || ""} ${selectedCertificate.bookingId?.vehicleId?.model || "Car"} (${selectedCertificate.bookingId?.vehicleId?.registrationNumber || "Reg N/A"})</div>
              </div>
              <div class="field-card">
                <div class="field-label">Warranty Duration</div>
                <div class="field-val">${selectedCertificate.warrantyPeriodMonths || 6} Months Coverage</div>
              </div>
              <div class="field-card">
                <div class="field-label">Issue Date</div>
                <div class="field-val">${new Date(selectedCertificate.startDate || selectedCertificate.createdAt || new Date()).toLocaleDateString("en-IN")}</div>
              </div>
              <div class="field-card">
                <div class="field-label">Valid Until (Expiry Date)</div>
                <div class="field-val" style="color: #EA580C;">${new Date(selectedCertificate.expiryDate || new Date()).toLocaleDateString("en-IN")}</div>
              </div>
              <div class="field-card" style="grid-column: span 2;">
                <div class="field-label">Issuing Workshop Partner</div>
                <div class="field-val">${selectedCertificate.partnerId?.businessName || "CarBlink Certified Workshop Partner"}</div>
              </div>
            </div>

            <div style="background: #FFF7ED; border: 1px dashed #FDBA74; padding: 16px; border-radius: 10px; font-size: 12px; color: #9A3412; margin-top: 10px;">
              <strong>Warranty Coverage Terms:</strong> This certificate guarantees official service warranty for the specified vehicle under CarBlink's quality assurance policies. Present this certificate or booking ID for any warranty claim inspections.
            </div>

            <div class="seal-stamp">
              ✔ Verified & Digitally Signed by CarBlink Quality Assurance
            </div>

            <div class="cert-footer">
              <p>CarBlink Services Pvt Ltd | Support Hotline: +91 90688 02453 | Web: www.carblink.in</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 md:space-y-8 container px-4 sm:px-6 md:px-8 mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary-orange" />
            <span>My Warranties</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">Track active warranty coverages and download official warranty certificates for your services.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search warranties..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10 rounded-xl bg-white border-gray-200 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Loading warranties...</p>
        </div>
      ) : filteredWarranties.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <ShieldCheck className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">
            {searchQuery ? `No warranties matching "${searchQuery}".` : "You don't have any active warranties yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {paginatedWarranties.map((warranty) => {
              const serviceName = warranty.bookingId?.serviceId?.name || "Service Warranty";
              const vehicleBrand = warranty.bookingId?.vehicleId?.brand || "";
              const vehicleModel = warranty.bookingId?.vehicleId?.model || "";
              const partnerName = warranty.partnerId?.businessName || "Workshop Partner";
              const startDateFormatted = new Date(warranty.startDate || warranty.createdAt || new Date()).toLocaleDateString("en-IN");
              const expiryDateFormatted = new Date(warranty.expiryDate || new Date()).toLocaleDateString("en-IN");

              return (
                <Card key={warranty._id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 relative overflow-hidden rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="bg-orange-50 p-2.5 rounded-xl text-primary-orange">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-heading font-bold text-gray-900 text-lg">
                              {serviceName}
                            </h4>
                            <p className="text-xs text-gray-500 font-medium">
                              Issued by: <strong className="text-gray-800">{partnerName}</strong>
                            </p>
                          </div>
                          <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${getStatusColor(warranty.status)}`}>
                            {warranty.status || "ACTIVE"}
                          </span>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <span className="text-gray-400 font-semibold block uppercase text-[10px]">Vehicle</span>
                            <span className="font-bold text-gray-800">{vehicleBrand} {vehicleModel || "Car"}</span>
                          </div>
                          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <span className="text-gray-400 font-semibold block uppercase text-[10px]">Warranty Duration</span>
                            <span className="font-bold text-gray-800">{warranty.warrantyPeriodMonths || 6} Months</span>
                          </div>
                          <div className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-100 col-span-2 sm:col-span-1">
                            <span className="text-orange-600 font-semibold block uppercase text-[10px]">Valid Until</span>
                            <span className="font-bold text-primary-orange">{expiryDateFormatted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap md:flex-col items-center md:items-end justify-end gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                        {/* Download Official Certificate PDF */}
                        <Button
                          type="button"
                          onClick={() => setSelectedCertificate(warranty)}
                          className="bg-primary-navy hover:bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <Download className="w-4 h-4 text-primary-orange" />
                          <span>Download PDF Certificate</span>
                        </Button>

                        {/* Partner Uploaded Document (If Available) */}
                        {warranty.warrantyDocumentUrl && (
                          <a
                            href={warranty.warrantyDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary-orange hover:underline font-semibold bg-orange-50 px-3 py-2 rounded-xl border border-orange-200"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Original Partner PDF</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {filteredWarranties.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 bg-white p-4 rounded-2xl border">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredWarranties.length)}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{filteredWarranties.length}</span> warranties
              </p>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === page
                          ? "bg-primary-orange text-white shadow-sm"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 text-xs flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CERTIFICATE PREVIEW & PRINT/DOWNLOAD MODAL */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-orange" />
                <h3 className="font-bold text-sm">CarBlink Official Warranty Certificate</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCertificate(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Certificate View Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div id="warranty-certificate-printable" className="bg-white border-8 border-slate-900 rounded-2xl p-8 shadow-sm text-slate-900 relative">
                {/* Cert Header */}
                <div className="text-center border-b-2 border-slate-100 pb-6 mb-6">
                  <div className="text-3xl font-black text-primary-orange tracking-tight">CARBLINK</div>
                  <div className="text-xl font-extrabold uppercase tracking-widest text-slate-900 mt-1">
                    Service Warranty Certificate
                  </div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">
                    Certificate ID: CB-WRN-{(selectedCertificate._id || "").slice(-8).toUpperCase()}
                  </div>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Service Covered</span>
                    <span className="font-extrabold text-slate-900 text-base">
                      {selectedCertificate.bookingId?.serviceId?.name || "Full Car Service"}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Warranty Status</span>
                    <span className="inline-block bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full mt-1">
                      {selectedCertificate.status || "ACTIVE"}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Vehicle Details</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedCertificate.bookingId?.vehicleId?.brand || ""} {selectedCertificate.bookingId?.vehicleId?.model || "Car"} ({selectedCertificate.bookingId?.vehicleId?.registrationNumber || "Reg N/A"})
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Warranty Duration</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedCertificate.warrantyPeriodMonths || 6} Months Coverage
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Issue Date</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {new Date(selectedCertificate.startDate || selectedCertificate.createdAt || new Date()).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Valid Until (Expiry)</span>
                    <span className="font-extrabold text-primary-orange text-sm">
                      {new Date(selectedCertificate.expiryDate || new Date()).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 col-span-1 sm:col-span-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Issuing Workshop Partner</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedCertificate.partnerId?.businessName || "CarBlink Certified Workshop Partner"}
                    </span>
                  </div>
                </div>

                {/* Terms Banner */}
                <div className="bg-orange-50 border border-dashed border-orange-300 p-4 rounded-xl text-xs text-orange-900">
                  <p className="font-bold mb-1">Warranty Terms & Conditions:</p>
                  <p>
                    This official certificate guarantees warranty coverage for parts & labor under CarBlink's quality standards. Present this certificate or booking ID for any claim inspection at partner workshops.
                  </p>
                </div>

                {/* Digital Stamp */}
                <div className="text-right text-xs font-bold text-primary-orange mt-6">
                  ✔ Verified & Digitally Signed by CarBlink Quality Assurance
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 px-6 bg-white border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Click "Print / Save PDF" to download as A4 Certificate.</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedCertificate(null)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
