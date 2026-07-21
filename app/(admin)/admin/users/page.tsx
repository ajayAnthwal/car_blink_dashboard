"use client";

import React, { useState, useEffect } from "react";
import { getAdminUsers, updateAdminUserStatus } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Users, Loader2, Search, PowerOff, Power } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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
      const res = await getAdminUsers(1, 50, roleFilter);
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
  }, [roleFilter]); // Refetch when role filter changes

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

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary-navy">User Management</h2>
      </div>

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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary-orange" />
              <span>All Users</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted" />
                <input 
                  type="text"
                  placeholder="Search users..."
                  className="pl-9 pr-4 py-2 border border-neutral-muted/20 rounded-lg text-sm focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-neutral-muted/20 rounded-lg text-sm focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange bg-white w-full sm:w-auto"
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
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-neutral-muted">
              <p>No users found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-muted uppercase bg-neutral-bg">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">User</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-muted/10">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-neutral-bg/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary-navy">
                        {user.fullName}
                      </td>
                      <td className="px-4 py-3">
                        <div>{user.email}</div>
                        <div className="text-xs text-neutral-muted mt-0.5">{user.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          user.role === 'PARTNER' ? 'bg-primary-orange/20 text-primary-orange-dark' :
                          user.role === 'CUSTOMER' ? 'bg-primary-navy/20 text-primary-navy' :
                          user.role === 'SUPER_ADMIN' ? 'bg-danger/10 text-danger' :
                          'bg-neutral-muted/20 text-neutral-dark'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.role !== 'SUPER_ADMIN' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className={user.isActive ? "border-danger text-danger hover:bg-danger/5" : "border-success text-success hover:bg-success/5"}
                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                            isLoading={actionId === user._id}
                            title={user.isActive ? "Suspend User" : "Activate User"}
                          >
                            {user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
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
