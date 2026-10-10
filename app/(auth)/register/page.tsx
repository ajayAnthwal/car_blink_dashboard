// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, sendSignupOtp } from "@/lib/services";
import { ROLES, Role, ROLE_ROUTES } from "@/lib/constants";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/layout/AuthLayout";
import GoogleButton from "@/components/ui/GoogleButton";
import {
  ArrowRight,
  UserPlus,
  User,
  Wrench,
  ShieldCheck,
  Lock,
  RotateCcw,
  MapPin,
  Compass,
  AlertCircle
} from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>(ROLES.CUSTOMER);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    // Partner specific structured fields
    businessName: "",
    workshopName: "",
    ownerName: "",
    businessType: "Proprietorship",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });

  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let timer: any;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const clean = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: clean.slice(0, 10) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError("");
  };

  // Browser Geolocation map pin picker (Native Web API, 0 external dependencies)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please enter coordinates manually.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setIsLocating(false);
        setError("");
      },
      (geoError) => {
        setIsLocating(false);
        setError("Could not retrieve your exact location. Please enter latitude and longitude manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = formData.phone.trim();
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)");
      return;
    }

    if (!formData.fullName.trim()) {
      setError(role === ROLES.PARTNER ? "Please enter the Owner / Contact Person Name" : "Please enter your Full Name");
      return;
    }

    // Role-specific validation
    if (role === ROLES.PARTNER) {
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setError("Partner Requirement: Please enter a valid Email Address.");
        return;
      }
      if (!formData.password || formData.password.length < 8) {
        setError("Partner Requirement: Password must be at least 8 characters long.");
        return;
      }
      const wName = (formData.workshopName || formData.businessName).trim();
      if (!wName) {
        setError("Partner Requirement: Please enter your Workshop / Garage Name.");
        return;
      }
      if (!formData.businessType) {
        setError("Partner Requirement: Please select your Business Type.");
        return;
      }
      if (!formData.addressLine.trim()) {
        setError("Partner Requirement: Please enter your Workshop Street Address.");
        return;
      }
      if (!formData.city.trim()) {
        setError("Partner Requirement: Please enter your City.");
        return;
      }
      if (!formData.state.trim()) {
        setError("Partner Requirement: Please enter your State.");
        return;
      }
      if (!formData.pincode.trim() || !/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
        setError("Partner Requirement: Please enter a valid 6-digit PIN code.");
        return;
      }
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        setError("Partner Requirement: Please set an exact Google Maps location pin (valid Lat -90..90 and Lng -180..180).");
        return;
      }
    } else {
      if (!formData.password || formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    }

    setIsLoading(true);

    try {
      await sendSignupOtp({ phone: cleanPhone });
      setStep(2);
      setResendTimer(30);
      setCanResend(false);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to send OTP to mobile number. Please check your number.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    if (role === ROLES.PARTNER && resendCount >= 3) {
      setError("Maximum OTP resend limit reached. Please wait before requesting another OTP.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await sendSignupOtp({ phone: formData.phone });
      setResendTimer(30);
      setCanResend(false);
      setResendCount((prev) => prev + 1);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP code received on your mobile");
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = formData.email && formData.email.trim() ? formData.email.trim() : undefined;
      const wName = (formData.workshopName || formData.businessName || formData.fullName).trim();

      const payload: any = {
        fullName: formData.fullName.trim(),
        email: cleanEmail,
        phone: formData.phone.trim(),
        password: formData.password,
        role: role,
        otp: cleanOtp,
      };

      if (role === ROLES.PARTNER) {
        payload.workshopName = wName;
        payload.businessName = wName;
        payload.ownerName = (formData.ownerName.trim() || formData.fullName.trim());
        payload.businessType = formData.businessType;
        payload.addressLine = formData.addressLine.trim();
        payload.city = formData.city.trim();
        payload.state = formData.state.trim();
        payload.pincode = formData.pincode.trim();
        payload.latitude = parseFloat(formData.latitude);
        payload.longitude = parseFloat(formData.longitude);
      }

      const res = await registerUser(payload);
      const userObj = res?.data?.user || res?.user || res?.data || res;
      const tokensObj = res?.data?.tokens || res?.tokens;

      if (tokensObj?.accessToken && userObj?.role) {
        await login(userObj, tokensObj.accessToken, tokensObj.refreshToken || tokensObj.accessToken);

        // Partner routing: Take directly to Application Status & KYC page, NEVER to dashboards
        if (userObj.role === ROLES.PARTNER) {
          window.location.href = "/partner/kyc";
        } else {
          const targetRoute = ROLE_ROUTES[userObj.role] || "/customer/dashboard";
          window.location.href = targetRoute;
        }
      } else {
        router.push(`/login`);
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Incorrect OTP or registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-orange/10 text-primary-orange mb-4 shadow-inner">
          {step === 1 ? <UserPlus className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 font-heading tracking-tight mb-1">
          {step === 1
            ? role === ROLES.PARTNER
              ? "Partner Workshop Registration"
              : "Create an Account"
            : "Verify Mobile Number"}
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm">
          {step === 1
            ? role === ROLES.PARTNER
              ? "Register your workshop and join CarBlink Verified Workshop Network"
              : "Join Carblink today and experience premium auto care"
            : `Enter the 6-digit OTP sent to +91 ${formData.phone}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-danger/10 text-danger text-xs sm:text-sm p-3.5 rounded-xl border border-danger/20 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {step === 1 ? (
        /* ================= STEP 1: REGISTRATION DETAILS ================= */
        <div className="space-y-4">
          {role === ROLES.CUSTOMER && (
            <div className="mb-2">
              <GoogleButton text="Sign up with Google" role={role} />
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  or sign up with form
                </span>
              </div>
            </div>
          )}

          {/* Account Role Selector */}
          <div className="pt-1 pb-1">
            <label className="block text-xs font-semibold text-gray-700 mb-2">I am registering as</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole(ROLES.CUSTOMER)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  role === ROLES.CUSTOMER
                    ? "border-primary-orange bg-orange-50/50 shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div
                  className={`p-1.5 rounded-full mb-1 ${
                    role === ROLES.CUSTOMER ? "bg-primary-orange text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <span className={`font-bold text-xs ${role === ROLES.CUSTOMER ? "text-gray-900" : "text-gray-500"}`}>
                  Customer
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole(ROLES.PARTNER)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  role === ROLES.PARTNER
                    ? "border-primary-navy bg-primary-navy/5 shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div
                  className={`p-1.5 rounded-full mb-1 ${
                    role === ROLES.PARTNER ? "bg-primary-navy text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                </div>
                <span className={`font-bold text-xs ${role === ROLES.PARTNER ? "text-gray-900" : "text-gray-500"}`}>
                  Partner Workshop
                </span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Owner / Contact Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {role === ROLES.PARTNER ? "Owner / Contact Person Name *" : "Full Name *"}
              </label>
              <Input
                name="fullName"
                placeholder={role === ROLES.PARTNER ? "e.g. Ramesh Chandra (Workshop Owner)" : "e.g. Rahul Kumar"}
                value={formData.fullName}
                onChange={handleChange}
                required
                className="h-11 bg-gray-50 border-gray-200 focus:bg-white text-sm"
              />
            </div>

            {/* Mobile & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="10-digit number"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address {role === ROLES.PARTNER ? "*" : "(Optional)"}
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required={role === ROLES.PARTNER}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password {role === ROLES.PARTNER ? "*(Min 8 characters)" : "*(Min 6 characters)"}
              </label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-11 bg-gray-50 border-gray-200 focus:bg-white text-sm"
              />
            </div>

            {/* Partner Specific Structured Fields */}
            {role === ROLES.PARTNER && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="flex items-center space-x-2 text-primary-navy font-bold text-xs border-b border-slate-200 pb-2">
                  <Wrench className="w-3.5 h-3.5 text-primary-orange" />
                  <span>Workshop Details & Physical Location</span>
                </div>

                {/* Workshop Name & Business Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Workshop / Garage Name *
                    </label>
                    <Input
                      name="workshopName"
                      placeholder="e.g. Apex Auto Works"
                      value={formData.workshopName}
                      onChange={handleChange}
                      required
                      className="h-10 bg-white border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Business Type *
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      required
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-navy"
                    >
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="LLP">LLP</option>
                      <option value="Company">Company (Pvt Ltd / Ltd)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Workshop Address */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Workshop Street Address *
                  </label>
                  <Input
                    name="addressLine"
                    placeholder="Shop/Plot No, Street, Industrial Area / Landmark"
                    value={formData.addressLine}
                    onChange={handleChange}
                    required
                    className="h-10 bg-white border-slate-200 text-xs"
                  />
                </div>

                {/* City, State, PIN */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      City *
                    </label>
                    <Input
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="h-10 bg-white border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      State *
                    </label>
                    <Input
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="h-10 bg-white border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      PIN Code *
                    </label>
                    <Input
                      name="pincode"
                      placeholder="6 digits"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      className="h-10 bg-white border-slate-200 text-xs"
                    />
                  </div>
                </div>

                {/* Exact Google Maps Location Pin */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-orange" />
                      Google Maps Location Pin *
                    </span>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="text-[11px] font-semibold text-primary-orange hover:text-primary-navy inline-flex items-center gap-1 transition-colors"
                    >
                      <Compass className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
                      {isLocating ? "Detecting..." : "Pin Current GPS Location"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        name="latitude"
                        type="number"
                        step="any"
                        placeholder="Latitude (-90 to 90)"
                        value={formData.latitude}
                        onChange={handleChange}
                        required
                        className="h-9 bg-slate-50 border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Input
                        name="longitude"
                        type="number"
                        step="any"
                        placeholder="Longitude (-180 to 180)"
                        value={formData.longitude}
                        onChange={handleChange}
                        required
                        className="h-9 bg-slate-50 border-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Exact coordinates ensure precision matching in the CarBlink assignment engine.
                  </p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold bg-primary-orange hover:bg-primary-orange-dark text-white shadow-md shadow-primary-orange/20 transition-all group mt-2"
              isLoading={isLoading}
            >
              Continue & Send SMS OTP
              {!isLoading && <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
        </div>
      ) : (
        /* ================= STEP 2: MANDATORY OTP VERIFICATION ================= */
        <form onSubmit={handleVerifyAndRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Enter 6-Digit SMS OTP</label>
            <Input
              name="otp"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
              required
              className="h-12 bg-gray-50 border-gray-200 focus:bg-white text-center tracking-[0.3em] font-bold text-lg"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>Didn't receive code?</span>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading || (role === ROLES.PARTNER && resendCount >= 3)}
                className="font-semibold text-primary-orange hover:underline inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Resend OTP
              </button>
            ) : (
              <span className="font-medium text-gray-400">Resend in {resendTimer}s</span>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-bold bg-primary-orange hover:bg-primary-orange-dark text-white shadow-md shadow-primary-orange/20 transition-all group mt-2"
            isLoading={isLoading}
            disabled={otp.length < 6 || isLoading}
          >
            Verify & Create Account
            {!isLoading && <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />}
          </Button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors pt-2"
          >
            ← Change Details / Edit Mobile Number
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs sm:text-sm">
        <span className="text-gray-500 font-medium">Already have an account?</span>
        <Link href="/login" className="ml-1.5 font-bold text-primary-navy hover:text-primary-navy-light transition-colors">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
