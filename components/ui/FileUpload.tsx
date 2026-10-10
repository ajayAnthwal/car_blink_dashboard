"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, FileText } from "lucide-react";
import { uploadFile } from "@/lib/services";
import toast from "react-hot-toast";

interface FileUploadProps {
  label?: string;
  folder?: string;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  currentValue?: string;
  className?: string;
}

export function FileUpload({ 
  label, 
  folder = "general", 
  onUploadSuccess, 
  onUploadError,
  currentValue,
  className = "" 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response: any = await uploadFile(file, folder);
      const fileUrl = response?.fileUrl || response?.data?.fileUrl || response?.data || response;
      if (!fileUrl || typeof fileUrl !== "string") {
        throw new Error("Invalid response received from upload server.");
      }
      onUploadSuccess(fileUrl);
      toast.success("File uploaded successfully!");
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "Upload failed. Please check the file and try again.";
      toast.error(errorMsg);
      if (onUploadError) {
        onUploadError(errorMsg);
      }
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onUploadSuccess("");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm font-medium text-neutral-dark">{label}</label>}
      
      {currentValue ? (
        <div className="relative rounded-xl border border-neutral-muted/20 overflow-hidden bg-neutral-bg group h-40">
          {currentValue.match(/\.(jpeg|jpg|gif|png|webp|heic|heif|avif|bmp|svg)$/i) || (currentValue.includes("image/upload") && !currentValue.endsWith('.pdf')) ? (
            <img src={currentValue} alt="Uploaded" className="w-full h-full object-cover" />
          ) : currentValue.includes("cloudinary.com") && currentValue.match(/\.pdf$/i) ? (
            <div className="relative w-full h-full">
              <img src={currentValue.replace(/\.pdf$/i, '.jpg')} alt="Invoice PDF Preview" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                <FileText className="w-3 h-3 text-primary-orange" /> PDF Document
              </div>
            </div>
          ) : currentValue.match(/\.pdf$/i) ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-primary-orange/5 text-primary-navy">
              <FileText className="w-10 h-10 mb-2 text-primary-orange" />
              <span className="text-sm font-bold truncate max-w-[80%]">PDF Document</span>
              <a href={currentValue} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-blue mt-1 hover:underline">Preview</a>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-primary-navy">
              <FileText className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs truncate max-w-[80%] opacity-70">Document Attached</span>
              <a href={currentValue} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-blue mt-1 hover:underline">Preview</a>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              type="button" 
              onClick={handleRemove}
              className="bg-danger text-white p-2 rounded-full hover:bg-danger/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors
            ${isUploading 
              ? "border-primary-orange/50 bg-primary-orange/5 cursor-not-allowed" 
              : "border-neutral-muted/30 hover:border-primary-orange hover:bg-neutral-bg cursor-pointer"
            }`}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mb-3" />
          ) : (
            <UploadCloud className="w-8 h-8 text-neutral-muted mb-3 group-hover:text-primary-orange" />
          )}
          <p className="text-sm font-medium text-neutral-dark">
            {isUploading ? "Uploading..." : "Click or drag file to this area"}
          </p>
          <p className="text-xs text-neutral-muted mt-1">
            Support for JPG, PNG, WebP, HEIC, AVIF, or PDF documents.
          </p>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,application/pdf,.heic,.heif,.avif,.webp,.png,.jpg,.jpeg"
      />
    </div>
  );
}
