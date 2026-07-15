"use client";

import { useEffect, useMemo, useState } from "react";
import apiClient from "../../../lib/apiClient";
import { useLanguage } from "../../../context/LanguageContext";
import CustomerFormModal, {
  Customer,
} from "../../components/customers/CustomerFormModal";
import RecordPaymentModal, {
  Payment,
} from "../../components/customers/RecordPaymentModal";

const FALLBACK_CUSTOMERS: Customer[] = [
  {
    id: "1",
    name: "Karim Mia",
    phone: "01712345678",
    dueBalance: 650,
    lastPaymentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "2",
    name: "Rina Akter",
    phone: "01898765432",
    dueBalance: 0,
    lastPaymentDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "3",
    name: "Jamal Uddin",
    phone: "01611223344",
    dueBalance: 1200,
    lastPaymentDate: null,
  },
  {
    id: "4",
    name: "Shirin Begum",
    phone: "01555667788",
    dueBalance: 340,
    lastPaymentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
];

function makeLocalId(prefix = "local") {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function CustomersPage() {
  const { language } = useLanguage();

  const [customers, setCustomers] = useState<Customer[]>(FALLBACK_CUSTOMERS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "due">("all");
  const [offlineNotice, setOfflineNotice] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<Customer[]>("/customers")
      .then(({ data }) => {
        if (!cancelled) setCustomers(data);
      })
      .catch(() => {
        if (!cancelled) setOfflineNotice(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalOutstanding = useMemo(
    () => customers.reduce((sum, c) => sum + c.dueBalance, 0),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers
      .filter((c) => (filter === "due" ? c.dueBalance > 0 : true))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q)
      );
  }, [customers, search, filter]);

  function openAddModal() {
    setEditingCustomer(null);
    setFormModalOpen(true);
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer);
    setFormModalOpen(true);
  }

  async function handleSaveCustomer(
    data: { name: string; phone: string },
    id?: string
  ): Promise<void> {
    try {
      if (id) {
        const { data: updated } = await apiClient.put<Customer>(
          `/customers/${id}`,
          data
        );
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? updated : c))
        );
      } else {
        const { data: created } = await apiClient.post<Customer>(
          "/customers",
          data
        );
        setCustomers((prev) => [created, ...prev]);
      }
      return;
    } catch (err: any) {
      if (err?.response) {
        throw err;
      }
      setOfflineNotice(true);
      if (id) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...data } : c))
        );
      } else {
        setCustomers((prev) => [
          {
            id: makeLocalId("cust"),
            ...data,
            dueBalance: 0,
            lastPaymentDate: null,
          },
          ...prev,
        ]);
      }
    }
  }

  function handlePaymentRecorded(updatedCustomer: Customer, _payment: Payment) {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
  }

  return (
    <div className="space-y-6 text-zinc-100 p-2">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {language === "bn" ? "বাকি খাতা" : "Baki Khata Ledger"}
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-normal">
            {language === "bn"
              ? "গ্রাহকের বকেয়া এবং পেমেন্ট ট্র্যাক করুন।"
              : "Monitor client exposure parameters and real-time ledger distributions."}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.98] shadow-lg shadow-emerald-500/10"
        >
          + {language === "bn" ? "গ্রাহক যোগ করুন" : "Add Customer Profile"}
        </button>
      </div>

      {/* OFFLINE DISMISS NOTICE */}
      {offlineNotice && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400 font-mono animate-in fade-in slide-in-from-top-2 duration-200">
          <span>
            {language === "bn"
              ? "সার্ভারের সাথে সংযোগ নেই — পরিবর্তনগুলো সাময়িকভাবে স্থানীয়ভাবে সংরক্ষিত হচ্ছে।"
              : "API Edge Unreachable — Operations temporary committed to current browser memory cache."}
          </span>
          <button
            onClick={() => setOfflineNotice(false)}
            className="ml-4 text-amber-500/60 hover:text-amber-400 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* ANALYTIC WIDGET PANELS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-5 shadow-sm">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {language === "bn" ? "মোট বকেয়া" : "Total Outstanding"}
          </p>
          <p className="mt-2 text-2xl font-bold font-sans text-rose-400 tracking-tight">
            ৳{totalOutstanding.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-5 shadow-sm">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {language === "bn" ? "বাকি থাকা গ্রাহক" : "Active Credit Accounts"}
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-100 tracking-tight">
            {customers.filter((c) => c.dueBalance > 0).length}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-5 shadow-sm">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {language === "bn" ? "মোট গ্রাহক" : "Total Database Indexes"}
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-400 tracking-tight">
            {customers.length}
          </p>
        </div>
      </div>

      {/* FILTER CONTROL SUB-BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            language === "bn" ? "নাম বা ফোন দিয়ে খুঁজুন…" : "Query name or phone parameters..."
          }
          className="w-full max-w-sm rounded-lg border border-zinc-900 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none transition-all focus:border-zinc-800"
        />
        <div className="flex gap-2 rounded-lg bg-zinc-950 p-1 border border-zinc-900/60 self-start sm:self-auto">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              filter === "all"
                ? "bg-zinc-900 text-white shadow"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {language === "bn" ? "সকল" : "All Accounts"}
          </button>
          <button
            onClick={() => setFilter("due")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              filter === "due"
                ? "bg-rose-500/10 text-rose-400 shadow border border-rose-500/20"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {language === "bn" ? "বাকি আছে" : "Dues Pending"}
          </button>
        </div>
      </div>

      {/* CORE DATA LEDGER GRID */}
      <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950 shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-900 bg-zinc-900/20 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-3.5">{language === "bn" ? "নাম" : "Client Name"}</th>
              <th className="px-5 py-3.5">{language === "bn" ? "ফোন" : "Contact Interface"}</th>
              <th className="px-5 py-3.5 text-right">{language === "bn" ? "বকেয়া" : "Statement Balance"}</th>
              <th className="px-5 py-3.5">{language === "bn" ? "সর্বশেষ পেমেন্ট" : "Last Event Timestamp"}</th>
              <th className="px-5 py-3.5 text-right">{language === "bn" ? "কার্যক্রম" : "Control Layer"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-xs font-mono text-zinc-600">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border border-zinc-700 border-t-zinc-400" />
                    {language === "bn" ? "লোড হচ্ছে…" : "Resolving active profile maps..."}
                  </div>
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-xs font-mono text-zinc-600">
                  {language === "bn" ? "কোনো গ্রাহক পাওয়া যায়নি।" : "Zero matching indexes detected."}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="group transition-colors hover:bg-zinc-900/20"
                >
                  <td className="px-5 py-4 text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {customer.name}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-zinc-500">
                    {customer.phone || "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {customer.dueBalance > 0 ? (
                      <span className="font-mono text-sm font-bold text-rose-400">
                        ৳{customer.dueBalance.toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-emerald-400 border border-emerald-500/20">
                        {language === "bn" ? "নিষ্পত্তি" : "Settled"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-zinc-500">
                    {customer.lastPaymentDate
                      ? new Date(customer.lastPaymentDate).toLocaleDateString(
                          language === "bn" ? "bn-BD" : "en-BD"
                        )
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-3 text-xs">
                      {customer.dueBalance > 0 && (
                        <button
                          onClick={() => setPayingCustomer(customer)}
                          className="rounded px-2.5 py-1 font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          {language === "bn" ? "পেমেন্ট নিন" : "Clear Balance"}
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(customer)}
                        className="rounded px-2.5 py-1 font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
                      >
                        {language === "bn" ? "সম্পাদনা" : "Modify"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL WINDOW ACTION INTERFACES */}
      {formModalOpen && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setFormModalOpen(false)}
          onSave={handleSaveCustomer}
        />
      )}

      {payingCustomer && (
        <RecordPaymentModal
          customer={payingCustomer}
          onClose={() => setPayingCustomer(null)}
          onRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
}