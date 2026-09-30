"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Wrench, 
  ShieldCheck, 
  HelpCircle, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Users, 
  Sparkles, 
  Car, 
  BadgeCheck, 
  MapPin, 
  Search, 
  GitCompare, 
  ThumbsUp,
  HeadphonesIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AboutCarBlinkPage() {
  const [activeTab, setActiveTab] = useState<"about" | "how-it-works" | "services" | "partners" | "support">("about");

  const servicesList = [
    {
      title: "Periodic Car Service",
      desc: "Comprehensive 40+ point inspection, engine oil replacement, oil filter change, fluid top-ups, and spark plug checks.",
      icon: Wrench,
      tag: "Popular",
    },
    {
      title: "Denting & Painting",
      desc: "Grade-A DuPont paint matching, panel-by-panel paint restoration, scratch repair, and deep body detailing.",
      icon: Sparkles,
      tag: "Quality Guarantee",
    },
    {
      title: "AC Repair & Servicing",
      desc: "AC gas refilling (R134a), leak detection, cooling coil cleaning, condenser flush, and cabin filter replacement.",
      icon: Car,
      tag: "Cooling Tech",
    },
    {
      title: "Batteries & Tyres",
      desc: "Multi-brand battery replacement with doorstep installation, tyre replacement, wheel alignment, and balancing.",
      icon: ShieldCheck,
      tag: "Express Fitting",
    },
    {
      title: "Car Spa & Detailing",
      desc: "3M Ceramic coating, interior deep sanitization, foam wash, Teflon polish, and headlight restoration.",
      icon: BadgeCheck,
      tag: "Showroom Shine",
    },
    {
      title: "Major Mechanical Repairs",
      desc: "Engine overhaul, clutch & gearbox repair, suspension overhaul, brake pad & disc replacement by certified experts.",
      icon: Building2,
      tag: "Certified Mechanics",
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Submit Service Request",
      desc: "Enter your car brand, model, city, and needed service details through your Customer Dashboard or Quick Form.",
      icon: FileText,
    },
    {
      step: "02",
      title: "Receive & Compare Bids",
      desc: "Multiple verified partner workshops in your city submit transparent competitive price quotes with estimated delivery times.",
      icon: GitCompare,
    },
    {
      step: "03",
      title: "Select & Track Live Job",
      desc: "Pick your preferred workshop based on ratings, pricing, and warranty. Track live inspection reports uploaded by operations executives.",
      icon: CheckCircle2,
    },
    {
      step: "04",
      title: "Hassle-Free Delivery & Warranty",
      desc: "Pay securely after work completion. Enjoy genuine spare parts warranty and dedicated post-service customer support.",
      icon: ThumbsUp,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 container px-4 sm:px-6 md:px-8 mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary-navy via-slate-900 to-blue-950 p-6 sm:p-10 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary-orange/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 font-bold text-xs uppercase tracking-wider mb-4 border border-orange-500/30">
            <Sparkles className="w-3.5 h-3.5" /> India's #1 Car Service Comparison Platform
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight leading-tight">
            About <span className="text-primary-orange">CarBlink</span>
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed font-body">
            Empowering car owners with transparent pricing, verified partner workshops, executive pickup/drop supervision, and hassle-free online service management.
          </p>
        </div>
      </div>

      {/* Interactive Navigation Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("about")}
          className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "about"
              ? "bg-primary-navy text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Building2 className="w-4 h-4" /> About Us
        </button>
        <button
          onClick={() => setActiveTab("how-it-works")}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "how-it-works"
              ? "bg-primary-navy text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <GitCompare className="w-4 h-4" /> How It Works
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "services"
              ? "bg-primary-navy text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Wrench className="w-4 h-4" /> Our Services
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "partners"
              ? "bg-primary-navy text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" /> Partner Network
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "support"
              ? "bg-primary-navy text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <HeadphonesIcon className="w-4 h-4" /> Support & Contact
        </button>
      </div>

      {/* TAB 1: ABOUT US */}
      {activeTab === "about" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-slate-100 shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">100% Price Transparency</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                No inflated bills or hidden fees. Compare real-time competitive quotes from top certified workshops in your city before booking.
              </p>
            </Card>

            <Card className="bg-white border-slate-100 shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">Verified Workshops</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Every workshop on CarBlink undergoes a rigorous 50+ point quality audit, background check, and tool standards verification.
              </p>
            </Card>

            <Card className="bg-white border-slate-100 shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">Executive Supervision</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Our operations executives supervise pickup/drop-off, perform pre-service inspections, and upload live progress reports directly to your portal.
              </p>
            </Card>
          </div>

          <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl p-6 sm:p-8">
            <h3 className="font-heading font-bold text-slate-900 text-xl mb-4">Our Mission</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              CarBlink was built to simplify auto care in India. Car owners often face opaque repair quotes, unverified spare parts, and lack of accountability. CarBlink bridges this gap by creating an open bidding ecosystem where certified multi-brand workshops present upfront pricing, genuine parts assurances, and standardized service warranties.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="font-heading font-extrabold text-2xl text-primary-navy">120K+</div>
                <div className="text-xs text-slate-500 font-medium">Happy Customers</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="font-heading font-extrabold text-2xl text-primary-orange">350+</div>
                <div className="text-xs text-slate-500 font-medium">Verified Workshops</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="font-heading font-extrabold text-2xl text-blue-600">25+</div>
                <div className="text-xs text-slate-500 font-medium">Major Cities</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="font-heading font-extrabold text-2xl text-emerald-600">4.8 ★</div>
                <div className="text-xs text-slate-500 font-medium">Average Rating</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: HOW IT WORKS */}
      {activeTab === "how-it-works" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((item, idx) => (
              <Card key={idx} className="bg-white border-slate-200/80 shadow-sm rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-heading font-black text-2xl text-primary-orange opacity-90">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-primary-orange flex items-center justify-center">
                      <item.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="font-heading font-bold text-slate-900 text-base mb-2">{item.title}</h4>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-orange-50 border border-blue-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-bold text-slate-900 text-lg">Ready to compare quotes for your car?</h4>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5">Submit a booking request and receive quotes from top workshops within minutes.</p>
            </div>
            <Link href="/customer/bookings/new">
              <Button size="lg" className="bg-primary-orange hover:bg-orange-600 text-white font-bold shrink-0">
                Book Service Now <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {/* TAB 3: OUR SERVICES */}
      {activeTab === "services" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesList.map((svc, idx) => (
              <Card key={idx} className="bg-white border-slate-200/80 shadow-sm rounded-2xl p-6 hover:border-primary-orange/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-navy/10 text-primary-navy flex items-center justify-center">
                    <svc.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {svc.tag}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-slate-900 text-lg mb-2">{svc.title}</h4>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{svc.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PARTNER NETWORK */}
      {activeTab === "partners" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl p-6 sm:p-8">
            <h3 className="font-heading font-bold text-slate-900 text-xl mb-3">Partner Workshop Quality Standards</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              CarBlink partners with OEM-grade, multi-brand auto workshops equipped with modern OBD-II diagnostic scanners, computerized wheel aligners, dust-free paint booths, and certified technicians.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">Genuine OEM / OES Parts</h5>
                  <p className="text-xs text-slate-500 mt-0.5">Only original manufacturer spare parts or certified OEM equivalents used.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">Service Warranty Included</h5>
                  <p className="text-xs text-slate-500 mt-0.5">Up to 1,000 km or 1-month comprehensive service warranty backed by CarBlink.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">Real-Time Photo & Video Logs</h5>
                  <p className="text-xs text-slate-500 mt-0.5">Operations executive uploads inspection and replacement media for complete proof.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">Fixed Upfront Pricing</h5>
                  <p className="text-xs text-slate-500 mt-0.5">No surprise additions. Additional work requires explicit customer authorization.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: SUPPORT & CONTACT */}
      {activeTab === "support" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-slate-900 text-base">Helpline Support</h4>
              <p className="text-slate-500 text-xs mt-1">Speak directly with our service advisor</p>
              <a href="tel:+919876543210" className="inline-block mt-3 text-sm font-bold text-primary-navy hover:underline">
                +91 98765 43210
              </a>
            </Card>

            <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-orange-50 text-primary-orange rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-slate-900 text-base">Email Assistance</h4>
              <p className="text-slate-500 text-xs mt-1">Send us your queries & support tickets</p>
              <a href="mailto:support@carblink.in" className="inline-block mt-3 text-sm font-bold text-primary-orange hover:underline">
                support@carblink.in
              </a>
            </Card>

            <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-slate-900 text-base">Operating Hours</h4>
              <p className="text-slate-500 text-xs mt-1">Monday – Sunday</p>
              <p className="mt-3 text-sm font-bold text-slate-800">
                09:00 AM – 08:00 PM IST
              </p>
            </Card>
          </div>

          <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-bold text-slate-900 text-lg">Have a specific question or issue?</h4>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5">Submit a support query directly from your customer portal support section.</p>
            </div>
            <Link href="/customer/support">
              <Button size="lg" className="bg-primary-navy hover:bg-slate-900 text-white font-bold shrink-0">
                Go to Support Desk <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
