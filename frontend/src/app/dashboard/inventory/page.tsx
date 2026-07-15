"use client";

import { useEffect, useMemo, useState } from "react";
import apiClient from "../../../lib/apiClient";
import { useLanguage } from "../../../context/LanguageContext";
import ProductFormModal, {
  Product,
} from "../../components/inventory/ProductFormModal";

// Fallback data so the page demos meaningfully before the API is wired up
const FALLBACK_PRODUCTS: Product[] = [
  { id: "1", name: "Rice 5kg", category: "Grocery", unitPrice: 340, costPrice: 300, stockQuantity: 42, lowStockThreshold: 10 },
  { id: "2", name: "Fresh Milk 1L", category: "Dairy", unitPrice: 80, costPrice: 65, stockQuantity: 18, lowStockThreshold: 15 },
  { id: "3", name: "Detergent Powder 1kg", category: "Household", unitPrice: 210, costPrice: 170, stockQuantity: 3, lowStockThreshold: 10 },
  { id: "4", name: "Lux Soap", category: "Personal Care", unitPrice: 40, costPrice: 30, stockQuantity: 60, lowStockThreshold: 20 },
  { id: "5", name: "Cooking Oil 2L", category: "Grocery", unitPrice: 480, costPrice: 420, stockQuantity: 5, lowStockThreshold: 8 },
];

function makeLocalId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function InventoryPage() {
  const { language } = useLanguage();

  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const { data } = await apiClient.get<Product[]>("/products");
        if (!cancelled) setProducts(data);
      } catch {
        if (!cancelled) setOfflineNotice(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  // clear the two-step delete confirmation automatically after a few seconds
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  function openAddModal() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  // Throws on a real API error (so the modal can show it and stay open).
  // Only falls back to a local optimistic update when the API is unreachable.
  async function handleSave(
    data: Omit<Product, "id">,
    id?: string
  ): Promise<void> {
    try {
      if (id) {
        const { data: updated } = await apiClient.put<Product>(
          `/products/${id}`,
          data
        );
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      } else {
        const { data: created } = await apiClient.post<Product>(
          "/products",
          data
        );
        setProducts((prev) => [created, ...prev]);
      }
      return;
    } catch (err: any) {
      if (err?.response) {
        // Real server-side rejection (validation, conflict, auth) — surface it
        throw err;
      }
      // No response at all — API isn't reachable yet, fall back for the demo
      setOfflineNotice(true);
      if (id) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...data } : p))
        );
      } else {
        setProducts((prev) => [{ id: makeLocalId(), ...data }, ...prev]);
      }
    }
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await apiClient.delete(`/products/${id}`);
    } catch {
      setOfflineNotice(true);
    } finally {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {language === "bn" ? "মজুদ ব্যবস্থাপনা" : "Inventory"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {language === "bn"
              ? "পণ্য যোগ, সম্পাদনা এবং মজুদ ট্র্যাক করুন।"
              : "Add, edit, and track stock across your shop."}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold/90"
        >
          + {language === "bn" ? "পণ্য যোগ করুন" : "Add product"}
        </button>
      </div>

      {offlineNotice && (
        <div className="flex items-center justify-between rounded-md border border-gold/30 bg-gold/5 px-4 py-2.5 text-sm text-gold">
          <span>
            {language === "bn"
              ? "সার্ভারের সাথে সংযোগ নেই — পরিবর্তনগুলো সাময়িকভাবে স্থানীয়ভাবে সংরক্ষিত হচ্ছে।"
              : "Can't reach the server right now — changes are being saved locally for this demo."}
          </span>
          <button
            onClick={() => setOfflineNotice(false)}
            className="ml-4 text-gold/70 hover:text-gold"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={
          language === "bn"
            ? "নাম বা ক্যাটাগরি দিয়ে খুঁজুন…"
            : "Search by name or category…"
        }
        className="w-full max-w-sm rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-paper placeholder:text-muted/60 outline-none focus:border-gold"
      />

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3">{language === "bn" ? "পণ্য" : "Product"}</th>
              <th className="px-5 py-3">{language === "bn" ? "ক্যাটাগরি" : "Category"}</th>
              <th className="px-5 py-3 text-right">{language === "bn" ? "বিক্রয় মূল্য" : "Unit price"}</th>
              <th className="px-5 py-3 text-right">{language === "bn" ? "মজুদ" : "Stock"}</th>
              <th className="px-5 py-3">{language === "bn" ? "অবস্থা" : "Status"}</th>
              <th className="px-5 py-3 text-right">{language === "bn" ? "কার্যক্রম" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  {language === "bn" ? "লোড হচ্ছে…" : "Loading products…"}
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  {language === "bn" ? "কোনো পণ্য পাওয়া যায়নি।" : "No products found."}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const isLow = product.stockQuantity <= product.lowStockThreshold;
                const confirming = confirmDeleteId === product.id;
                return (
                  <tr
                    key={product.id}
                    className="border-b border-line/50 last:border-0 hover:bg-surfaceAlt/40"
                  >
                    <td className="px-5 py-3.5 font-medium">{product.name}</td>
                    <td className="px-5 py-3.5 text-muted">{product.category || "—"}</td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      ৳{product.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      {product.stockQuantity}
                    </td>
                    <td className="px-5 py-3.5">
                      {isLow ? (
                        <span className="rounded-full border border-rust/40 bg-rust/10 px-2.5 py-0.5 font-mono text-xs text-rust">
                          {language === "bn" ? "কম মজুদ" : "Low stock"}
                        </span>
                      ) : (
                        <span className="rounded-full border border-taka/40 bg-taka/10 px-2.5 py-0.5 font-mono text-xs text-taka">
                          {language === "bn" ? "পর্যাপ্ত" : "In stock"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-3 text-xs">
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-muted hover:text-gold"
                        >
                          {language === "bn" ? "সম্পাদনা" : "Edit"}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className={
                            confirming
                              ? "font-semibold text-rust"
                              : "text-muted hover:text-rust disabled:opacity-50"
                          }
                        >
                          {deletingId === product.id
                            ? language === "bn" ? "মুছছে…" : "Deleting…"
                            : confirming
                            ? language === "bn" ? "নিশ্চিত করুন?" : "Confirm?"
                            : language === "bn" ? "মুছুন" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}