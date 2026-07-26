"use client";

import React, { useState, useEffect } from "react";
import { getSuperAdminStaff, createSuperAdminStaff, getSuperAdminRoles } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, UserCheck, Plus, ShieldCheck } from "lucide-react";

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [customRoleId, setCustomRoleId] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        getSuperAdminStaff(),
        getSuperAdminRoles()
      ]);
      setStaffList(staffRes.data?.docs || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      console.error("Failed to load staff/roles", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password || !customRoleId) {
      alert("Please fill all required fields.");
      return;
    }

    setIsCreating(true);
    try {
      await createSuperAdminStaff({
        fullName,
        email,
        phone,
        password,
        customRoleId
      });
      alert("Staff member created successfully!");
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setCustomRoleId("");
      fetchData();
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || "Failed to create staff.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-navy to-gray-800 rounded-3xl p-6 flex items-center justify-between shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Staff & Sub-Admins</h1>
            <p className="text-white/90 mt-1 font-medium">Manage team members and their roles (RBAC).</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create Staff Form */}
        <div className="lg:col-span-1">
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200 sticky top-24">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-orange" /> Add New Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                  <input 
                    type="email" 
                    placeholder="john@carblink.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                  <input 
                    type="text" 
                    placeholder="9876543210"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Temporary Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Assign Role</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm"
                    value={customRoleId}
                    onChange={(e) => setCustomRoleId(e.target.value)}
                  >
                    <option value="">Select a Role...</option>
                    {roles.map(r => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="w-full mt-2 bg-primary-navy hover:bg-blue-900 text-white font-bold py-3 rounded-xl transition-colors shadow-md disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Account"}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: List of Staff */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-orange" /> Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
                  <p className="font-medium">Loading staff...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">Name & Contact</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Role</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {staffList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-10 text-gray-400 font-medium">No sub-admins found.</td>
                        </tr>
                      ) : (
                        staffList.map((staff: any) => (
                          <tr key={staff._id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900">{staff.fullName}</div>
                              <div className="text-xs text-gray-500 mt-1">{staff.email} • {staff.phone}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                                {staff.customRoleId?.name || staff.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                staff.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {staff.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
