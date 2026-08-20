import React from "react";
import Link from "next/link";
import { Car, Zap, Shield, Sparkles, ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://carblink.in";

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel (Visuals) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-navy flex-col justify-between p-12">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary-orange blur-[120px]" />
          <div className="absolute bottom-[10%] -left-[20%] w-[60%] h-[60%] rounded-full bg-blue-500 blur-[100px]" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <a href={websiteUrl} className="inline-flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-primary-orange rounded-xl flex items-center justify-center shadow-lg shadow-primary-orange/30 group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white font-heading tracking-tight">CarBlink</span>
          </a>
        </div>

        <div className="relative z-10 max-w-lg mt-12 mb-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight font-heading mb-6">
            The future of auto care, <span className="text-primary-orange">at your fingertips.</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Experience seamless vehicle servicing, smart partner management, and real-time logistics tracking all in one premium platform.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Zap className="w-6 h-6 text-primary-orange" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Lightning Fast Booking</h3>
                <p className="text-gray-400 text-sm">Book your services in under 60 seconds.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Secure & Verified</h3>
                <p className="text-gray-400 text-sm">100% verified partners and secure payments.</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Premium Experience</h3>
                <p className="text-gray-400 text-sm">End-to-end concierge support for your vehicle.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12">
          <p className="text-sm text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} CarBlink Technologies. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        {/* Mobile Logo */}
        <div className="absolute top-6 left-6 lg:hidden">
          <a href={websiteUrl} className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-orange rounded-lg flex items-center justify-center shadow-sm">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary-navy font-heading">CarBlink</span>
          </a>
        </div>

        {/* Back to Main Website CTA Button */}
        <a
          href={websiteUrl}
          className="absolute top-6 right-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-primary-orange hover:text-white rounded-full transition-all duration-200 shadow-sm border border-gray-200/80 group"
        >
          <ArrowLeft className="w-4 h-4 text-primary-orange group-hover:text-white transition-colors" />
          <span>Back to Website</span>
        </a>
        
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 mt-16 lg:mt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
