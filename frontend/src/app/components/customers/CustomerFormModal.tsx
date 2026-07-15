"use client";

import { useEffect, useState, FormEvent } from "react";
import { useLanguage } from "../../../context/LanguageContext";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  dueBalance: number;
  lastPaymentDate: string | null;
}

export type CustomerInput = Pick<Customer, "name" | "phone">;

interface CustomerFormModalProps {
  customer: Customer | null; // null = creating a new customer
  onClose: () => void;
  onSave: (data: CustomerInput, id?: string) => Promise<void>;
}

export default function CustomerFormModal({
  customer,
  onClose,
  onSave,
}: CustomerFormModalProps) {
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(customer?.name ?? "");
    setPhone(customer?.phone ?? "");
  }, [customer]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(language === "bn" ? "গ্রাহকের নাম দিন।" : "Customer name is required.");
      return;
    }

    setSaving(true);
    try {
      await onSave({ name: name.trim(), phone: phone.trim() }, customer?.id);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          (language === "bn"
            ? "সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।"
            : "Couldn't save the customer — please try again.")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-900 bg-zinc-950 p-6 shadow-2xl text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {customer
              ? language === "bn" ? "গ্রাহক সম্পাদনা" : "Edit Customer"
              : language === "bn" ? "নতুন গ্রাহক" : "Add Customer"}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* CUSTOMER PROFILE ENTRY FORM */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {language === "bn" ? "নাম" : "Full Name"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Karim Mia"
              className="mt-1.5 w-full rounded-lg border border-zinc-900 bg-zinc-900/40 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none transition-all focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {language === "bn" ? "ফোন নম্বর" : "Phone Number"}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="mt-1.5 w-full rounded-lg border border-zinc-900 bg-zinc-900/40 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none transition-all focus:border-emerald-500/50"
            />
          </div>

          {/* ASYNC FORM ERROR ACTIONS */}
          {error && (
            <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-400 font-mono">
              {error}
            </p>
          )}

          {/* INTERACTION ACTION WRAPPERS */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {language === "bn" ? "বাতিল" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-emerald-500/10"
            >
              {saving
                ? language === "bn" ? "সংরক্ষণ হচ্ছে…" : "Saving…"
                : language === "bn" ? "সংরক্ষণ করুন" : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}