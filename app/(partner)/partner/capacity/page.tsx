// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Save, CheckCircle2 } from "lucide-react";
import { useUpdateCapacityMutation } from "@/features/partner/hooks/usePartnerSecondaryQueries";

export default function CapacityPage() {
  const [dailyCapacity, setDailyCapacity] = useState<number>(5);
  const [blockedDate, setBlockedDate] = useState<string>("");
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  const updateCapacityMutation = useUpdateCapacityMutation();

  const handleAddDate = () => {
    if (blockedDate && !blockedDates.includes(blockedDate)) {
      setBlockedDates([...blockedDates, blockedDate]);
      setBlockedDate("");
    }
  };

  const handleRemoveDate = (date: string) => {
    setBlockedDates(blockedDates.filter((d) => d !== date));
  };

  const handleSave = async () => {
    setMessage({ type: "", text: "" });
    try {
      await updateCapacityMutation.mutateAsync({ dailyCapacity, blockedDates });
      setMessage({ type: "success", text: "Capacity and blocked dates updated successfully." });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to update capacity." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary-navy flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-primary-orange" />
          Slot & Capacity Management
        </h2>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm border font-medium flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border-green-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message.type === "success" && <CheckCircle2 className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Vehicle Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Set the maximum number of cars your garage can service per day.</p>
            <Input
              type="number"
              min="1"
              value={dailyCapacity.toString()}
              onChange={(e) => setDailyCapacity(Number(e.target.value))}
              label="Cars per day"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Block Holiday Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Select dates when your garage will be closed.</p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={blockedDate}
                onChange={(e) => setBlockedDate(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddDate} variant="outline">Add</Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {blockedDates.length === 0 && <span className="text-xs text-gray-400">No dates blocked.</span>}
              {blockedDates.map((date) => (
                <div key={date} className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border border-gray-200">
                  <span className="font-medium text-gray-700">{new Date(date).toLocaleDateString()}</span>
                  <button onClick={() => handleRemoveDate(date)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={updateCapacityMutation.isPending} className="bg-primary-orange hover:bg-orange-600 text-white min-w-[150px]">
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
