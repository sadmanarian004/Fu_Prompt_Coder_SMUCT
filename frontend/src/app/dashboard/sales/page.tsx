"use client";

import { useEffect, useMemo, useState } from "react";
import apiClient from "../../../lib/apiClient";
import { useLanguage } from "../../../context/LanguageContext";
import InvoiceModal, { Sale, SaleItem } from "../../components/sales/InvoiceModal";
import { Product } from "../../components/inventory/ProductFormModal";

const FALLBACK_PRODUCTS: Product[] = [
  { id: "1", name: "Rice 5kg", category: "Grocery", unitPrice: 340, costPrice: 300, stockQuantity: 42, lowStockThreshold: 10 },
  { id: "2", name: "Fresh Milk 1L", category: "Dairy", unitPrice: 80, costPrice: 65, stockQuantity: 18, lowStockThreshold: 15 },
  { id: "3", name: "Detergent Powder 1kg", category: "Household", unitPrice: 210, costPrice: 170, stockQuantity: 3, lowStockThreshold: 10 },
  { id: "4", name: "Lux Soap", category: "Personal Care", unitPrice: 40, costPrice: 30, stockQuantity: 60, lowStockThreshold: 20 },
  { id: "5", name: "Cooking Oil 2L", category: "Grocery", unitPrice: 480, costPrice: 420, stockQuantity: 5, lowStockThreshold: 8 },
];

const FALLBACK_RECENT_SALES: Sale[] = [
  {
    id: "s1",
    invoiceNo: "INV-0231",
    customerName: "Walk-in customer",
    items: [{ productId: "1", name: "Rice 5kg", unitPrice: 340, quantity: 2 }],
    total: 680,
    paymentType: "paid",
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: "s2",
    invoiceNo: "INV-0230",
    customerName: "Karim Mia",
    items: [{ productId: "5", name: "Cooking Oil 2L", unitPrice: 480, quantity: 1 }],
    total: 480,
    paymentType: "credit",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

function makeLocalId(prefix = "sale") {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SalesPage() {
  const { language } = useLanguage();

  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [recentSales, setRecentSales] = useState<Sale[]>(FALLBACK_RECENT_SALES);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<Product[]>("/products")
      .then(({ data }) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        /* keep fallback products for the demo */
      });
    apiClient
      .get<Sale[]>("/sales/recent")
      .then(({ data }) => {
        if (!cancelled) setRecentSales(data);
      })
      .catch(() => {
        /* keep fallback sales for the demo */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  function addToCart() {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product || quantity < 1) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.unitPrice,
          quantity,
        },
      ];
    });
    setSelectedProductId("");
    setQuantity(1);
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function handleRecordSale() {
    setError(null);
    if (cart.length === 0) {
      setError(
        language === "bn"
          ? "অন্তত একটি পণ্য যোগ করুন।"
          : "Add at least one item before recording the sale."
      );
      return;
    }
    if (paymentType === "credit" && !customerName.trim()) {
      setError(
        language === "bn"
          ? "বাকিতে বিক্রির জন্য গ্রাহকের নাম প্রয়োজন।"
          : "A customer name is required for a credit (baki) sale."
      );
      return;
    }

    setSubmitting(true);
    const payload = {
      items: cart,
      customerName: customerName.trim() || "Walk-in customer",
      paymentType,
      total,
    };

    try {
      const { data: created } = await apiClient.post<Sale>("/sales", payload);
      setRecentSales((prev) => [created, ...prev]);
      setActiveInvoice(created);
    } catch (err: any) {
      if (err?.response) {
        setError(
          err.response?.data?.message ??
            (language === "bn"
              ? "বিক্রয় রেকর্ড করা যায়নি।"
              : "Couldn't record the sale.")
        );
        setSubmitting(false);
        return;
      }
      const localSale: Sale = {
        id: makeLocalId("sale"),
        invoiceNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      setRecentSales((prev) => [localSale, ...prev]);
      setActiveInvoice(localSale);
    } finally {
      setCart([]);
      setCustomerName("");
      setPaymentType("paid");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 text-zinc-100">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {language === "bn" ? "বিক্রয় ও রশিদ" : "Sales & Invoicing"}
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          {language === "bn"
            ? "একটি বিক্রয় রেকর্ড করুন এবং রশিদ তৈরি করুন।"
            : "Process manual customer checkouts and instantly deploy active invoice bills."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 items-start">
        {/* NEW SALE COMPONENT CART PANEL */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 shadow-xl lg:col-span-3 space-y-5">
          <h2 className="text-lg font-semibold text-white tracking-tight">
            {language === "bn" ? "নতুন বিক্রয়" : "Checkout Counter"}
          </h2>

          {/* ADD PRODUCT ROW INTERFACE */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-900 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-200 outline-none transition-all focus:border-emerald-500/50"
            >
              <option value="" className="bg-zinc-950">
                {language === "bn" ? "পণ্য নির্বাচন করুন" : "Select a product..."}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-950">
                  {p.name} — ৳{p.unitPrice.toLocaleString()}
                </option>
              ))}
            </select>
            
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full sm:w-24 rounded-lg border border-zinc-900 bg-zinc-900/40 px-3 py-2 text-sm text-center font-mono text-zinc-200 outline-none transition-all focus:border-emerald-500/50"
            />
            
            <button
              onClick={addToCart}
              disabled={!selectedProductId}
              className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
            >
              {language === "bn" ? "যোগ করুন" : "Add Item"}
            </button>
          </div>

          {/* CART VIEW SCHEMATIC */}
          <div className="rounded-lg border border-zinc-900 bg-zinc-900/10 p-4 min-h-[5rem]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center text-xs text-zinc-500 font-mono">
                {language === "bn" ? "কার্টে কোনো পণ্য নেই।" : "Empty terminal cart layout."}
              </div>
            ) : (
              <ul className="divide-y divide-zinc-950">
                {cart.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0 group"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-200">{item.name}</span>
                      <span className="text-xs text-zinc-500 font-mono">
                        ৳{item.unitPrice.toLocaleString()} × {item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-medium text-zinc-300">
                        ৳{(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-zinc-600 hover:text-rose-400 transition-colors"
                        aria-label="Remove"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* META TRANSACTION FOOTER ELEMENTS */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {language === "bn" ? "গ্রাহকের নাম (ঐচ্ছিক)" : "Customer Identity"}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={language === "bn" ? "ওয়াক-ইন গ্রাহক" : "Walk-in customer"}
                className="mt-1.5 w-full rounded-lg border border-zinc-900 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none transition-all focus:border-emerald-500/50"
              />
            </div>
            
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {language === "bn" ? "পেমেন্ট" : "Payment Terms"}
              </label>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType("paid")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    paymentType === "paid"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm"
                      : "border-zinc-900 bg-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {language === "bn" ? "পরিশোধিত" : "Cash / Paid"}
                </button>
                
                <button
                  type="button"
                  onClick={() => setPaymentType("credit")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    paymentType === "credit"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm"
                      : "border-zinc-900 bg-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {language === "bn" ? "বাকি" : "Credit (Baki)"}
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC ERROR BOUNDARY FEEDBACK */}
          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-400 font-mono">
              {error}
            </div>
          )}

          {/* METRIC ROW AND SUBMIT ACTIONS */}
          <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-2">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {language === "bn" ? "সর্বমোট" : "Gross Total"}
              </p>
              <p className="text-2xl font-black text-white font-mono tracking-tight mt-0.5">
                ৳{total.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleRecordSale}
              disabled={submitting || cart.length === 0}
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-emerald-500/10"
            >
              {submitting
                ? language === "bn" ? "রেকর্ড হচ্ছে…" : "Processing..."
                : language === "bn" ? "বিক্রয় সম্পন্ন করুন" : "Checkout Invoice"}
            </button>
          </div>
        </div>

        {/* SIDEBAR RECENT INVOICE REGISTRY */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 shadow-xl lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-zinc-400">
            {language === "bn" ? "সাম্প্রতিক বিক্রয়" : "Recent Ledger"}
          </h2>
          
          <ul className="divide-y divide-zinc-900">
            {recentSales.map((sale) => (
              <li
                key={sale.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-zinc-200 text-xs sm:text-sm">{sale.customerName}</p>
                  <p className="font-mono text-[10px] text-zinc-500">
                    {sale.invoiceNo} ·{" "}
                    {new Date(sale.createdAt).toLocaleTimeString(
                      language === "bn" ? "bn-BD" : "en-BD",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-mono font-medium text-zinc-300 text-xs">
                    ৳{sale.total.toLocaleString()}
                  </p>
                  <button
                    onClick={() => setActiveInvoice(sale)}
                    className="inline-block text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {language === "bn" ? "রশিদ দেখুন" : "Open Bill"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ABSOLUTE MODAL INJECTION */}
      {activeInvoice && (
        <InvoiceModal
          sale={activeInvoice}
          shopName="Your Shop"
          onClose={() => setActiveInvoice(null)}
        />
      )}
    </div>
  );
}