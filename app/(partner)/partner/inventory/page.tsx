"use client";

import React, { useState, useEffect } from "react";
import { getInventory, addStockItem, updateStockItem, deleteStockItem } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, Plus, Trash2, Edit2, Check } from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [itemName, setItemName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await getInventory();
      setItems(res?.data || []);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addStockItem({
        itemName,
        partNumber,
        quantity: parseInt(quantity),
        price: parseFloat(price)
      });
      setItemName("");
      setPartNumber("");
      setQuantity("");
      setPrice("");
      fetchInventory();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQty = async (id: string) => {
    try {
      await updateStockItem(id, { quantity: parseInt(editQty) });
      setEditingId(null);
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStockItem(id);
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Spare Parts Inventory</h2>
        <p className="text-gray-500 mt-2">Manage your stock, track quantities, and update prices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Item Form */}
        <div className="lg:col-span-1">
          <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-gray-100">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-heading tracking-tight flex items-center">
                <Plus className="w-5 h-5 mr-2 text-primary-orange" /> Add New Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddItem} className="space-y-4">
                <Input label="Item Name" placeholder="e.g. Engine Oil 5W-30" value={itemName} onChange={e => setItemName(e.target.value)} required />
                <Input label="Part Number (SKU)" placeholder="e.g. OIL-5W30" value={partNumber} onChange={e => setPartNumber(e.target.value)} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Quantity" type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                  <Input label="Price (₹)" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} required />
                </div>
                <Button type="submit" isLoading={isSubmitting} className="w-full bg-primary-orange hover:bg-orange-600 text-white mt-2">
                  Add to Inventory
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Inventory List */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-gray-100 h-full">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-heading tracking-tight flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="w-5 h-5 mr-2 text-gray-500" /> Current Stock
                </div>
                <span className="text-sm font-medium text-gray-400">{items.length} items</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading inventory...</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No items in inventory. Add some stock to get started.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map(item => (
                        <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{item.itemName}</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">{item.partNumber}</p>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">₹{item.price}</td>
                          <td className="px-6 py-4">
                            {editingId === item._id ? (
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="number" 
                                  className="w-16 p-1 border rounded text-center text-sm" 
                                  value={editQty} 
                                  onChange={e => setEditQty(e.target.value)} 
                                />
                                <button onClick={() => handleUpdateQty(item._id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className={`font-bold ${item.quantity < 5 ? 'text-red-500' : 'text-gray-900'}`}>{item.quantity}</span>
                                <button onClick={() => { setEditingId(item._id); setEditQty(item.quantity.toString()); }} className="text-gray-400 hover:text-primary-orange">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDelete(item._id)} className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      </div>
    </div>
  );
}
