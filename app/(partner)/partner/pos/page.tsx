// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus, FileText, Trash2, Printer, Loader2, Download } from "lucide-react";
import { useInventory, usePosInvoices, useGeneratePosInvoiceMutation } from "@/features/partner/hooks/usePartnerSecondaryQueries";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function POSPage() {
  const { data: inventory = [], isLoading: isLoadingInventory } = useInventory();
  const { data: invoices = [], isLoading: isLoadingInvoices } = usePosInvoices();
  
  const generateInvoiceMutation = useGeneratePosInvoiceMutation();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<{ id: string, name: string, quantity: number, price: number }[]>([]);
  
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedQty, setSelectedQty] = useState("1");

  const isLoading = isLoadingInventory || isLoadingInvoices;

  const handleAddItem = () => {
    if (!selectedItem) return;
    const invItem = inventory.find((i: unknown) => i._id === selectedItem);
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
    try {
      await generateInvoiceMutation.mutateAsync({
        customerName,
        customerPhone,
        items: items.map(i => ({ inventoryItemId: i.id, quantity: i.quantity, price: i.price })),
        totalAmount
      });
      setCustomerName("");
      setCustomerPhone("");
      setItems([]);
      alert("Invoice generated successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const generateInvoicePDF = (inv: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("INVOICE", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("CarBlink Partner Services", 14, 30);
    doc.text(`Date: ${new Date(inv.createdAt).toLocaleDateString()}`, 14, 36);
    doc.text(`Invoice #: ${inv._id.substring(0, 8).toUpperCase()}`, 14, 42);

    // Customer Info
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text("Bill To:", 14, 55);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Name: ${inv.customerName}`, 14, 62);
    doc.text(`Phone: ${inv.customerPhone || 'N/A'}`, 14, 68);

    // Items Table
    const tableColumn = ["Item", "Quantity", "Price", "Subtotal"];
    const tableRows: any[] = [];

    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach((item: any) => {
        const itemName = item.inventoryItemId?.itemName || 'Item';
        const qty = item.quantity || 1;
        const price = item.price || 0;
        const subtotal = qty * price;
        tableRows.push([itemName, qty, `Rs. ${price}`, `Rs. ${subtotal}`]);
      });
    }

    autoTable(doc, {
      startY: 75,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] }, // Primary orange
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 75;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Amount: Rs. ${inv.totalAmount}`, 14, finalY + 15);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your business!", 14, finalY + 30);

    doc.save(`Invoice_${inv._id.substring(0, 8)}.pdf`);
  };

  return (
    <div className="space-y-8 pb-12">
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
                      options={[{ value: "", label: "-- Select Item --" }, ...inventory.map((i: unknown) => ({ value: i._id, label: `${i.itemName} (₹${i.price})` }))]}
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
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-gray-500 font-medium">Total Amount:</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalAmount}</p>
              </div>

              <Button type="submit" isLoading={generateInvoiceMutation.isPending} className="w-full bg-primary-navy hover:bg-primary-navy-light text-white">
                <Printer className="w-4 h-4 mr-2" /> Generate Invoice
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-gray-100">
          <CardHeader className="border-b border-gray-50 pb-4 bg-gray-50/50">
            <CardTitle className="text-lg font-heading tracking-tight flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-500" /> Recent POS Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="p-8 flex justify-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin text-primary-orange" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No invoices generated yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invoices.slice(0, 10).map((inv: unknown) => (
                  <div key={inv._id} className="py-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors px-2 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{inv.customerName}</p>
                      <p className="text-xs text-gray-500">{new Date(inv.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-primary-orange font-medium mt-0.5">{inv.items?.length || 0} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{inv.totalAmount}</p>
                      <button 
                        onClick={() => generateInvoicePDF(inv)}
                        className="text-xs text-blue-600 hover:underline mt-1 flex items-center justify-end w-full"
                      >
                        <Download className="w-3 h-3 mr-1" /> Download PDF
                      </button>
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
