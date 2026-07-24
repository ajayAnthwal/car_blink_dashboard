"use client";

import React, { useState, useEffect } from "react";
import { generatePosInvoice, getPosInvoices, getInventory } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus, FileText, Trash2, Printer } from "lucide-react";

export default function POSPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<{ id: string, name: string, quantity: number, price: number }[]>([]);
  
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedQty, setSelectedQty] = useState("1");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, posRes] = await Promise.all([getInventory(), getPosInvoices()]);
      const invArray = invRes?.data?.docs || invRes?.data || invRes?.docs || [];
      setInventory(Array.isArray(invArray) ? invArray : []);
      const posArray = posRes?.data?.docs || posRes?.data || posRes?.docs || [];
      setInvoices(Array.isArray(posArray) ? posArray : []);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedItem) return;
    const invItem = inventory.find(i => i._id === selectedItem);
    if (!invItem) return;

    const qty = parseInt(selectedQty) || 1;
    const existing = items.find(i => i.id === selectedItem);
    if (existing) {
      setItems(items.map(i => i.id === selectedItem ? { ...i, quantity: i.quantity + qty } : i));
    } else {
      setItems([...items, { id: invItem._id, name: invItem.itemName, quantity: qty, price: invItem.price }]);
    }
    setSelectedItem("");
    setSelectedQty("1");
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Please add at least one item to generate an invoice.");
      return;
    }
    setIsGenerating(true);
    try {
      await generatePosInvoice({
        customerName,
        customerPhone,
        items: items.map(i => ({ inventoryItemId: i.id, quantity: i.quantity, price: i.price })),
        totalAmount
      });
      setCustomerName("");
      setCustomerPhone("");
      setItems([]);
      fetchData();
      alert("Invoice generated successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Point of Sale (POS)</h2>
        <p className="text-gray-500 mt-2">Generate instant offline invoices for walk-in customers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* New Invoice Form */}
        <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-gray-100">
          <CardHeader className="border-b border-gray-50 pb-4 bg-gray-50/50">
            <CardTitle className="text-lg font-heading tracking-tight flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-primary-orange" /> New Bill
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleGenerateInvoice} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Customer Name" placeholder="Walk-in Customer" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                <Input label="Phone Number" placeholder="e.g. 9876543210" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              </div>
              
              <div className="border border-gray-200 p-4 rounded-xl space-y-4 bg-gray-50/50">
                <label className="block text-sm font-bold text-gray-700">Add Items</label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Select 
                      label=""
                      value={selectedItem}
                      onChange={e => setSelectedItem(e.target.value)}
                      options={[{ value: "", label: "-- Select Item --" }, ...inventory.map(i => ({ value: i._id, label: `${i.itemName} (₹${i.price})` }))]}
                    />
                  </div>
                  <div className="w-24">
                    <Input label="" type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(e.target.value)} />
                  </div>
                  <Button type="button" onClick={handleAddItem} variant="outline" className="mt-1 h-10 border-gray-300">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 font-medium border-b border-gray-100">
                          <th className="text-left pb-2">Item</th>
                          <th className="text-center pb-2">Qty</th>
                          <th className="text-right pb-2">Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item.id} className="border-b border-gray-50">
                            <td className="py-2 text-gray-900">{item.name}</td>
                            <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                            <td className="py-2 text-right font-medium">₹{item.price * item.quantity}</td>
                            <td className="py-2 text-right">
                              <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 flex justify-between items-center text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-primary-orange">₹{totalAmount}</span>
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" isLoading={isGenerating} className="w-full h-12 text-lg bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg">
                Generate Invoice
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-gray-100 h-full">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-lg font-heading tracking-tight flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-500" /> Recent Invoices
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No invoices generated yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invoices.map(invoice => (
                  <div key={invoice._id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{invoice.customerName}</h4>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{new Date(invoice.createdAt).toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">{invoice.items?.length || 0} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">₹{invoice.totalAmount}</p>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 mt-1">
                        <Printer className="w-3 h-3 mr-1" /> Print
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
  );
}
