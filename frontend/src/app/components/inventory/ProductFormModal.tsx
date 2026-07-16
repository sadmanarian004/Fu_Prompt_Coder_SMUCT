"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";

// 🛡️ The master Product interface lives here
export interface Product {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface ProductFormModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (data: Omit<Product, "id">, id?: string) => Promise<void>;
}

export default function ProductFormModal({
  product,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const { language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  
  // ... rest of your ProductFormModal logic stays exactly the same as before ...



  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  // Hydrate fields if we are editing an existing product
  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category || "");
      setUnitPrice(product.unitPrice);
      setCostPrice(product.costPrice);
      setStockQuantity(product.stockQuantity);
      setLowStockThreshold(product.lowStockThreshold);
    } else {
      // Reset to defaults for fresh creations
      setName("");
      setCategory("");
      setUnitPrice(0);
      setCostPrice(0);
      setStockQuantity(0);
      setLowStockThreshold(5);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Omit<Product, "id"> = {
        name,
        category,
        unitPrice,
        costPrice,
        stockQuantity,
        lowStockThreshold,
      };
      await onSave(payload, product?.id);
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      {/* Modal Card */}
      <div className="w-full max-w-lg rounded-lg border border-line bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
          <h2 className="font-display text-xl font-semibold text-paper">
            {product
              ? language === "bn"
                ? "পণ্য সম্পাদনা করুন"
                : "Edit Product"
              : language === "bn"
              ? "নতুন পণ্য যোগ করুন"
              : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-paper text-xl"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              {language === "bn" ? "পণ্যের নাম" : "Product Name"} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-line bg-surfaceAlt px-3 py-2 text-sm text-paper outline-none focus:border-gold"
              placeholder={language === "bn" ? "যেমন: চাল ৫ কেজি" : "e.g. Rice 5kg"}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              {language === "bn" ? "ক্যাটাগরি" : "Category"}
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-line bg-surfaceAlt px-3 py-2 text-sm text-paper outline-none focus:border-gold"
              placeholder={language === "bn" ? "যেমন: গ্রোসারি" : "e.g. Grocery"}
            />
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                {language === "bn" ? "বিক্রয় মূল্য (৳)" : "Selling Price (৳)"}
              </label>
              <input
                type="number"
                min="0"
                value={unitPrice || ""}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full rounded-md border border-line bg-surfaceAlt px-3 py-2 text-sm text-paper font-mono outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                {language === "bn" ? "ক্রয় মূল্য (৳)" : "Cost Price (৳)"}
              </label>
              <input
                type="number"
                min="0"
                value={costPrice || ""}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full rounded-md border border-line bg-surfaceAlt px-3 py-2 text-sm text-paper font-mono outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Stock Quantities */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                {language === "bn" ? "মজুদ পরিমাণ" : "Stock Quantity"}
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity || ""}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full rounded-md border border-line bg-surfaceAlt px-3 py-2 text-sm text-paper font-mono outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                {language === "bn" ? "কম মজুদের সীমা" : "Low Stock Alert Limit"}
              </label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold || ""}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full rounded-md border border-line bg-surfaceAlt px-3 py-2 text-sm text-paper font-mono outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-line bg-transparent px-4 py-2 text-sm font-semibold text-muted hover:bg-surfaceAlt hover:text-paper"
            >
              {language === "bn" ? "বাতিল" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90 disabled:opacity-50"
            >
              {submitting
                ? language === "bn"
                  ? "সংরক্ষণ হচ্ছে..."
                  : "Saving..."
                : language === "bn"
                ? "সংরক্ষণ করুন"
                : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}