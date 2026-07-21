"use client";

import React, { useState, useEffect } from "react";
import { getKycDocuments, uploadKycDocument, uploadFile } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { FileUpload } from "@/components/ui/FileUpload";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FileText, Loader2, CheckCircle, Clock } from "lucide-react";

interface KycDocument {
  _id: string;
  documentType: string;
  documentUrl: string;
  status: string;
  uploadedAt: string;
}

export default function PartnerKycPage() {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [documentType, setDocumentType] = useState("GST_CERTIFICATE");
  const [fileUrl, setFileUrl] = useState<string>("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await getKycDocuments();
      setDocuments(res?.docs || res || []);
    } catch (err) {
      console.error("Failed to load KYC documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) {
      setMessage({ type: "error", text: "Please upload a document first." });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      // 2. Create KYC record
      await uploadKycDocument({
        documentType,
        documentUrl: fileUrl
      });

      setMessage({ type: "success", text: "Document submitted successfully!" });
      setFileUrl("");
      fetchDocuments();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to upload document." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const documentTypes = [
    { value: "GST_CERTIFICATE", label: "GST Certificate" },
    { value: "SHOP_LICENSE", label: "Shop License" },
    { value: "ID_PROOF", label: "ID Proof (Aadhar/PAN)" },
    { value: "ADDRESS_PROOF", label: "Address Proof" },
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED": return "bg-success/10 text-success border-success/20";
      case "REJECTED": return "bg-danger/10 text-danger border-danger/20";
      case "PENDING": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
    }
  };

  const formatDocType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">KYC Verification</h2>
      
      <p className="text-neutral-muted text-sm mb-6">
        Please upload your business documents to verify your account and start receiving leads.
      </p>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === "success" 
            ? "bg-success/10 text-success border-success/20" 
            : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary-orange" />
            <span>Upload Document</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <Select
              label="Document Type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              options={documentTypes}
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1.5">File</label>
              <FileUpload
                folder="kyc"
                onUploadSuccess={setFileUrl}
                currentValue={fileUrl}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSubmitting} disabled={!fileUrl}>
                Submit Document
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-bold text-primary-navy mb-4">Uploaded Documents</h3>
        {isLoading ? (
          <div className="flex items-center justify-center p-10 bg-neutral-white rounded-2xl shadow-sm border border-neutral-muted/20">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
            <FileText className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
            <p className="text-neutral-muted">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary-navy/5 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-primary-navy" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-navy">{formatDocType(doc.documentType)}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs text-neutral-muted mt-1 gap-2">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}
                          </span>
                          <a 
                            href={doc.documentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-orange hover:underline font-medium"
                          >
                            View File
                          </a>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status?.toUpperCase() === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {doc.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
