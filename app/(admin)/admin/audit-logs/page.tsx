"use client";

import React, { useState, useEffect } from "react";
import { getAuditLogs } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck, Clock, User, Activity } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await getAuditLogs();
      const dataArray = res?.data?.docs || res?.data || res?.docs || [];
      setLogs(Array.isArray(dataArray) ? dataArray : []);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-primary-navy flex items-center">
          <ShieldCheck className="w-6 h-6 mr-2 text-primary-orange" /> 
          System Audit Logs
        </h2>
        <p className="text-neutral-muted text-sm mt-1">Track all critical actions performed across the platform.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <Activity className="w-12 h-12 text-gray-300 mb-3 mx-auto" />
          <p className="text-gray-500">No audit logs found.</p>
        </div>
      ) : (
        <Card className="shadow-subtle border-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Action</th>
                    <th className="px-6 py-4 font-semibold">User</th>
                    <th className="px-6 py-4 font-semibold">IP Address</th>
                    <th className="px-6 py-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-primary-navy block mb-1">{log.action}</span>
                        {log.details && (
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 inline-block max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-700">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {log.userId?.fullName || log.userId || "System"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {log.ipAddress || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
