"use client";

import React, { useState, useEffect } from "react";
import { getAdminUsers, updateAdminUserStatus } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Loader2, Search, PowerOff, Power, UserCheck, UserX, ShieldAlert } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [roleFilter, setRoleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminUsers(1, 100, roleFilter);
      const data = Array.isArray(res) ? res : (res?.users || res?.docs || []);
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setActionId(id);
    setMessage({ type: "", text: "" });
    try {
      await updateAdminUserStatus(id, { isActive: !currentStatus });
      setMessage({ type: "success", text: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully.` });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || `Failed to update user status.` });
    } finally {
      setActionId(null);
    }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    setActionId(id);
    setMessage({ type: "", text: "" });
    try {
      await updateAdminUserStatus(id, { role: newRole });
      setMessage({ type: "success", text: `User role updated successfully.` });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || `Failed to update user role.` });
    } finally {
      setActionId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 p-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-primary-navy to-primary-navy border border-primary-navy/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-heading tracking-tight">User Management</h2>
            <p className="text-white/80 mt-1 font-medium">Control access and roles for all platform users.</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm border font-medium flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border-green-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message.type === "success" ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <Card className="bg-white/90 backdrop-blur-md shadow-sm border-white/40 overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg text-primary-navy font-bold">All Users Directory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search by name, email..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-navy focus:ring-1 focus:ring-primary-navy w-full bg-white transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-navy focus:ring-1 focus:ring-primary-navy bg-white w-full sm:w-auto shadow-sm cursor-pointer font-medium text-gray-700"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customer</option>
                <option value="PARTNER">Partner</option>
                <option value="EXECUTIVE">Executive</option>
                <option value="ACCOUNTS">Accounts</option>
                <option value="SUPER_ADMIN">Admin</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
              <p className="font-medium">Loading user database...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-gray-400 flex flex-col items-center">
              <Users className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-gray-500">No users found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">User</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Contact Details</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Role</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 border border-gray-200 text-gray-600 font-bold shadow-sm">
                            {user.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-gray-900 group-hover:text-primary-navy transition-colors">{user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{user.email}</div>
                        <div className="text-xs text-gray-500 mt-1">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'SUPER_ADMIN' ? (
                          <span className="px-3 py-1 text-[11px] font-bold tracking-wide uppercase rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                            {user.role}
                          </span>
                        ) : (
                          <select
                            className={`px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-primary-navy/50 transition-all ${
                              user.role === 'PARTNER' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                              user.role === 'CUSTOMER' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              user.role === 'EXECUTIVE' ? 'bg-green-100 text-green-700 border-green-200' :
                              user.role === 'ACCOUNTS' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                            value={user.role}
                            onChange={(e) => handleChangeRole(user._id, e.target.value)}
                            disabled={actionId === user._id}
                          >
                            <option value="CUSTOMER">Customer</option>
                            <option value="PARTNER">Partner</option>
                            <option value="EXECUTIVE">Executive</option>
                            <option value="ACCOUNTS">Accounts</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-[11px] font-bold tracking-wide uppercase rounded-full inline-flex items-center gap-1.5 ${
                          user.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role !== 'SUPER_ADMIN' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className={`rounded-xl shadow-sm transition-all ${
                              user.isActive 
                                ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" 
                                : "border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                            }`}
                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                            isLoading={actionId === user._id}
                            title={user.isActive ? "Suspend User" : "Activate User"}
                          >
                            {user.isActive ? <PowerOff className="w-4 h-4 mr-1.5" /> : <Power className="w-4 h-4 mr-1.5" />}
                            {user.isActive ? "Suspend" : "Activate"}
                          </Button>
                        )}
                        {user.role === 'SUPER_ADMIN' && (
                          <span className="text-xs font-medium text-gray-400 flex items-center justify-end gap-1">
                            <ShieldAlert className="w-3 h-3" /> Protected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
