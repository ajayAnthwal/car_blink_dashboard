"use client";

import React, { useState, useEffect } from "react";
import { getStaff, addPartnerStaff, updateStaffStatus, updateStaffMember, deleteStaffMember } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Phone, Briefcase, Trash2, Edit2 } from "lucide-react";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Mechanic");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await getStaff();
      const dataArray = res?.data?.docs || res?.data || res?.docs || [];
      setStaff(Array.isArray(dataArray) ? dataArray : []);
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateStaffMember(editingId, { name, phone, role });
      } else {
        await addPartnerStaff({ name, phone, role });
      }
      setName("");
      setPhone("");
      setRole("Mechanic");
      setEditingId(null);
      fetchStaff();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await deleteStaffMember(id);
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await updateStaffStatus(id, { status: newStatus });
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const roleOptions = [
    { value: "Mechanic", label: "Mechanic" },
    { value: "Electrician", label: "Electrician" },
    { value: "Denter", label: "Denter/Painter" },
    { value: "Manager", label: "Manager" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Staff Management</h2>
        <p className="text-gray-500 mt-2">Manage mechanics and other staff members in your garage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Staff Form */}
        <div className="lg:col-span-1">
          <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-gray-100">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-heading tracking-tight flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-primary-orange" /> {editingId ? "Edit Staff" : "Add Staff"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Full Name" placeholder="e.g. Raju Mechanic" value={name} onChange={e => setName(e.target.value)} required />
                <Input label="Phone Number" placeholder="e.g. 9876543210" value={phone} onChange={e => setPhone(e.target.value)} required />
                <Select label="Role" value={role} onChange={e => setRole(e.target.value)} options={roleOptions} required />
                <Button type="submit" isLoading={isSubmitting} className="w-full bg-primary-orange hover:bg-orange-600 text-white mt-2">
                  {editingId ? "Update Member" : "Add Member"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => { setEditingId(null); setName(""); setPhone(""); setRole("Mechanic"); }} className="w-full mt-2">
                    Cancel
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-gray-100 h-full">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-heading tracking-tight flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-gray-500" /> Team Members
                </div>
                <span className="text-sm font-medium text-gray-400">{staff.length} members</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading staff...</div>
              ) : staff.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No staff members found. Add your team.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                  {staff.map(member => (
                    <div key={member._id} className="border border-gray-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-900">{member.name}</h4>
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {member.status || 'Active'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <Briefcase className="w-4 h-4 mr-2 text-gray-400" /> {member.role}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" /> {member.phone}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex gap-3">
                          <button onClick={() => { setEditingId(member._id); setName(member.name); setPhone(member.phone); setRole(member.role); }} className="text-gray-400 hover:text-primary-orange transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(member._id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8"
                          onClick={() => toggleStatus(member._id, member.status || 'Active')}
                        >
                          {member.status === 'Active' ? 'Mark Inactive' : 'Mark Active'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
