// @ts-nocheck
"use client";

import React from "react";
import Link from "next/link";
import WebsitePromotionalBanners from "@/components/home/WebsitePromotionalBanners";
import {
  Car,
  ShieldCheck,
  Wrench,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Clock,
  MapPin,
  Star,
  Award,
  ChevronRight,
  UserCheck,
} from "lucide-react";

export default function PublicWebsiteHomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-primary-orange selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-primary-orange to-amber-600 text-white text-xs font-extrabold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-sm">
        <Sparkles className="w-4 h-4 animate-bounce" />
        <span>Monsoon Detailing Special: Get Up To 25% Off On Paint Protection Film & Ceramic Coating!</span>
      </div>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-orange to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight font-heading text-white">
                Car<span className="text-primary-orange">Blink</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase -mt-1">
                Doorstep Auto Spa
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#services" className="hover:text-primary-orange transition-colors">
              Services
            </a>
            <a href="#promotions" className="hover:text-primary-orange transition-colors">
              Offers & Banners
            </a>
            <a href="#how-it-works" className="hover:text-primary-orange transition-colors">
              How It Works
            </a>
            <a href="#why-us" className="hover:text-primary-orange transition-colors">
              Why Us
            </a>
          </div>

          {/* Login / Portal Button */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="bg-gradient-to-r from-primary-orange to-orange-600 hover:from-orange-600 hover:to-primary-orange text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-orange-500/30 flex items-center gap-2"
            >
              Sign In / Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-primary-orange text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Award className="w-4 h-4" /> India's #1 Doorstep Detailing Platform
              </div>

              <h1 className="text-4xl sm:text-6xl font-black font-heading leading-tight tracking-tight text-white">
                Premium Car Spa & Detailing <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-orange to-amber-400">At Your Doorstep.</span>
              </h1>

              <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Book certified detailing experts, compare instant partner bids, and get high-gloss Ceramic Coating, PPF, and deep car wash at home.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Link
                  href="/login"
                  className="bg-primary-orange hover:bg-orange-600 text-white font-extrabold px-8 py-4 rounded-2xl text-base transition-all shadow-xl hover:shadow-orange-500/30 flex items-center justify-center gap-3"
                >
                  Book Service Now <ChevronRight className="w-5 h-5" />
                </Link>
                <a
                  href="#promotions"
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-2xl text-base border border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  View Active Offers
                </a>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
                <div>
                  <h4 className="text-2xl font-black text-white font-heading">15,000+</h4>
                  <p className="text-xs text-slate-400 font-medium">Cars Serviced</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white font-heading">4.9 ★</h4>
                  <p className="text-xs text-slate-400 font-medium">Customer Rating</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white font-heading">100%</h4>
                  <p className="text-xs text-slate-400 font-medium">Guaranteed Satisfaction</p>
                </div>
              </div>
            </div>

            {/* Right Side Visual Banner Preview */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group">
                <img
                  src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1000&auto=format&fit=crop"
                  alt="Car Detailing Spa"
                  className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent p-6 flex flex-col justify-end">
                  <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 text-white flex items-center gap-4 shadow-xl">
                    <div className="w-12 h-12 rounded-xl bg-primary-orange text-white flex items-center justify-center font-bold">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Certified Detailing Partners</h4>
                      <p className="text-xs text-slate-400">Professional Grade Products & Equipment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔥 EXECUTIVE PROMOTIONAL ADS SECTION */}
      <section id="promotions" className="py-12 bg-slate-950 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-primary-orange text-xs font-extrabold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" /> Live Website Promotions
              </div>
              <h2 className="text-3xl font-extrabold text-white font-heading">
                Latest Promotional Campaigns & Deals
              </h2>
            </div>
            <p className="text-slate-400 text-sm font-medium max-w-md">
              Special offers and discount banners managed dynamically by our operations team.
            </p>
          </div>
        </div>

        {/* Dynamic Executive Banner Ads Carousel (Hero Placement) */}
        <WebsitePromotionalBanners placement="HOME_HERO" />

        {/* Dynamic Executive Banner Ads (Middle Placement) */}
        <WebsitePromotionalBanners placement="HOME_MIDDLE" />
      </section>

      {/* Services Grid Section */}
      <section id="services" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              Our Professional Car Care Services
            </h2>
            <p className="text-slate-400 text-base font-medium">
              Choose from our wide range of doorstep services backed by warranty and transparent bidding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Paint Protection Film (PPF)",
                price: "Starts @ ₹15,000",
                desc: "TPU self-healing film for ultimate scratch & chip protection.",
                icon: ShieldCheck,
                badge: "Most Popular",
              },
              {
                title: "9H Ceramic Coating",
                price: "Starts @ ₹4,999",
                desc: "Deep hydrophobic gloss & 3-year paint protection layer.",
                icon: Sparkles,
                badge: "High Gloss",
              },
              {
                title: "Full Body Deep Car Wash",
                price: "Starts @ ₹499",
                desc: "Foam wash, interior vacuum, tire dressing & liquid wax polish.",
                icon: Car,
                badge: "Doorstep",
              },
              {
                title: "Interior Deep Spa & Sanitization",
                price: "Starts @ ₹1,299",
                desc: "Steam cleaning, leather conditioning & germ-free sanitization.",
                icon: Wrench,
                badge: "Hygiene Special",
              },
            ].map((srv, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-primary-orange/50 transition-all duration-300 hover:-translate-y-1 space-y-4 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-primary-orange flex items-center justify-center group-hover:bg-primary-orange group-hover:text-white transition-colors">
                      <srv.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                      {srv.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-primary-orange transition-colors">
                      {srv.title}
                    </h3>
                    <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">{srv.desc}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-400 font-mono">{srv.price}</span>
                  <Link href="/login" className="text-xs font-bold text-white hover:text-primary-orange flex items-center gap-1">
                    Book <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              How CarBlink Works
            </h2>
            <p className="text-slate-400 text-base font-medium">
              3 simple steps to get doorstep car detailing at unbeatable prices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Request a Service",
                desc: "Select your vehicle model, choose car care service, and post your request.",
              },
              {
                step: "02",
                title: "Compare Partner Bids",
                desc: "Verified partner workshops submit competitive bids. Choose the best quote.",
              },
              {
                step: "03",
                title: "Doorstep Execution",
                desc: "Assigned Executive handles service delivery at your home or garage.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 relative">
                <span className="text-5xl font-black font-heading text-primary-orange/20 block">{item.step}</span>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-orange flex items-center justify-center text-white">
              <Car className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-white">CarBlink Operations & Detailing Platform</span>
          </div>

          <p className="text-xs text-slate-500">© 2026 CarBlink Technologies Pvt Ltd. All rights reserved.</p>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Customer Login
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Partner Portal
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Executive Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
