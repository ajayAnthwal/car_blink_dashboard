// @ts-nocheck
"use client";

import React from "react";
import { useCustomerBookings } from "@/features/customer/hooks/useCustomerQueries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Wrench, ShieldCheck, CheckCircle2, MapPin, Phone, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CustomerVehicleStatusPage() {
  const { data: bookingsData, isLoading } = useCustomerBookings();
  const bookings = bookingsData?.bookings || [];

  const activeBooking = bookings.find((b: any) =>
    ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)
  ) || bookings[0];

  const currentStage = activeBooking?.status === 'COMPLETED' ? 4 : activeBooking?.status === 'IN_PROGRESS' ? 2 : 1;

  const serviceStages = [
    { stage: 1, title: 'Vehicle Pickup & Inspection', description: 'Car received at garage, initial 40-point safety inspection in progress.', icon: MapPin },
    { stage: 2, title: 'Mechanics Repairing & Servicing', description: 'Engine oil change, filter replacements, and mechanical repairs under way.', icon: Wrench },
    { stage: 3, title: 'Quality Check & Car Washing', description: 'Final quality assurance check, diagnostic scan, and deep exterior wash.', icon: ShieldCheck },
    { stage: 4, title: 'Ready for Delivery / Pickup', description: 'All services completed! Vehicle is ready for drop-off or pickup.', icon: CheckCircle2 }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-2xl border">
        <Loader2 className="w-10 h-10 text-primary-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-navy flex items-center gap-3">
          <Car className="w-8 h-8 text-primary-orange" /> Vehicle Live Service Status
        </h1>
        <p className="text-neutral-muted text-sm mt-1">
          Track real-time service progress, stage updates, and garage delivery timelines for your vehicle.
        </p>
      </div>

      {!activeBooking ? (
        <Card className="p-8 text-center border-dashed">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">No Active Service In Progress</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Book a service for your car to view live status tracking here.</p>
          <Link href="/customer/garage">
            <Button className="bg-primary-orange hover:bg-orange-600 text-white font-bold">
              Book Service Now
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 shadow-sm border border-gray-200 bg-white">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold text-neutral-muted uppercase tracking-wider">Service Booking ID</span>
                  <p className="font-bold text-primary-navy text-lg">#{activeBooking._id?.substring(0, 10).toUpperCase()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  activeBooking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  activeBooking.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {activeBooking.status === 'COMPLETED' ? 'SERVICE COMPLETED 🎉' : activeBooking.status === 'IN_PROGRESS' ? 'WORK IN PROGRESS 🔧' : 'GARAGE REVIEW PENDING ⏳'}
                </span>
              </div>

              <div className="mt-8 space-y-8 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-gray-200 before:z-0">
                {serviceStages.map((s) => {
                  const isDone = s.stage < currentStage || activeBooking.status === 'COMPLETED';
                  const isCurrent = s.stage === currentStage && activeBooking.status !== 'COMPLETED';
                  const Icon = s.icon;

                  return (
                    <div key={s.stage} className="relative z-10 flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm transition-all ${
                        isDone ? 'bg-emerald-500 ring-4 ring-emerald-100' :
                        isCurrent ? 'bg-primary-orange ring-4 ring-orange-100 animate-bounce' :
                        'bg-gray-300 text-gray-500'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-bold text-sm ${isCurrent ? 'text-primary-orange' : 'text-gray-800'}`}>
                            Stage {s.stage}: {s.title}
                          </h4>
                          {isCurrent && <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-bold uppercase">Active Stage</span>}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{s.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary-navy to-slate-900 text-white rounded-2xl shadow-md">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <Car className="w-5 h-5 text-primary-orange" /> Vehicle Information
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400 text-xs block">Car Brand & Model</span>
                  <span className="font-bold text-base">{activeBooking.vehicleId?.brand || 'Car'} {activeBooking.vehicleId?.model || 'Vehicle'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block">Registration Number</span>
                  <span className="font-mono font-bold text-orange-400 bg-white/10 px-2 py-1 rounded inline-block">
                    {activeBooking.vehicleId?.registrationNumber || 'MH02AB1234'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block">Booked Service Category</span>
                  <span className="font-semibold text-gray-200">{activeBooking.serviceId?.name || 'Full Comprehensive Service'}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
                <Link href="/customer/support">
                  <Button className="w-full bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs">
                    <Phone className="w-3.5 h-3.5 mr-2" /> Contact Customer Support
                  </Button>
                </Link>
                <Link href="/customer/bookings">
                  <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10 text-xs shadow-2xs">
                    View Full Booking Details <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
