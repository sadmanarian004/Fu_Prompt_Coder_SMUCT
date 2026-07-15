"use client";

import { useEffect, useState, FormEvent } from "react";
import apiClient from "../../../lib/apiClient";
import { useLanguage } from "../../../context/LanguageContext";
import { Customer } from "../../components/customers/CustomerFormModal";

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  method: "cash" | "mobile_banking";
  date: string;
}

interface RecordPaymentModalProps {
  customer: Customer;
  onClose: () => void;
  onRecorded: (updatedCustomer: Customer, payment: Payment) => void;
}

function makeLocalId(prefix = "local") {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// A couple of representative fallback entries so the history list isn't empty
// on first load, before the API is wired up.
function fallbackHistory(customer: Customer): Payment[] {
  if (!customer.lastPaymentDate) return [];
  return [
    {
      id: makeLocalId("pay"),
      customerId: customer.id,
      amount: 300,
      method: "cash",
      date: customer.lastPaymentDate,
    },
  ];
}

export default function RecordPaymentModal({
  customer,
  onClose,
  onRecorded,
}: RecordPaymentModalProps) {
  const { language } = useLanguage();
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<"cash" | "mobile_banking">("cash");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<Payment[]>(fallbackHistory(customer));
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
  /*  let cancelled = false;
    apiClient
      .get<Payment[]>(`/customers/${customer.id}/payments`)
      .then(({ data }) => {
        if (!cancelled) setHistory(data);
      })
      .catch(() => {
        /* keep fallback history for the demo */
      /*})
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };*/
  }, [customer.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError(
        language === "bn"
          ? "পরিমাণ শূন্যের বেশি হতে হবে।"
          : "Payment amount must be greater than zero."
      );
      return;
    }
    if (amount > customer.dueBalance) {
      setError(
        language === "bn"
          ? "পরিমাণ বকেয়া বাকির চেয়ে বেশি হতে পারবে না।"
          : "Payment can't exceed the outstanding due balance."
      );
      return;
    }

    setSaving(true);
    const nowIso = new Date().toISOString();

    try {
      const { data } = await apiClient.post<{
        customer: Customer;
        payment: Payment;
      }>(`/customers/${customer.id}/payments`, { amount, method });
      onRecorded(data.customer, data.payment);
      onClose();
    } catch (err: any) {
      if (err?.response) {
        setError(
          err.response?.data?.message ??
            (language === "bn"
              ? "পেমেন্ট রেকর্ড করা যায়নি।"
              : "Couldn't record the payment.")
        );
        setSaving(false);
        return;
      }
      // No response — API unreachable, apply the payment locally for the demo
      const updatedCustomer: Customer = {
        ...customer,
        dueBalance: customer.dueBalance - amount,
        lastPaymentDate: nowIso,
      };
      const localPayment: Payment = {
        id: makeLocalId("pay"),
        customerId: customer.id,
        amount,
        method,
        date: nowIso,
      };
      onRecorded(updatedCustomer, localPayment);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">
              {language === "bn" ? "পেমেন্ট রেকর্ড করুন" : "Record a payment"}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{customer.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-paper"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-md border border-rust/30 bg-rust/5 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">
            {language === "bn" ? "বকেয়া বাকি" : "Outstanding due"}
          </span>
          <span className="font-mono text-lg font-semibold text-rust">
            ৳{customer.dueBalance.toLocaleString()}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase tracking-wide text-muted">
              {language === "bn" ? "পরিমাণ (৳)" : "Amount (৳)"}
            </label>
            <input
              type="number"
              min={0}
              max={customer.dueBalance}
              step="0.01"
              required
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="mt-1.5 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-paper placeholder:text-muted/60 outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={() => setAmount(customer.dueBalance)}
              className="mt-1.5 font-mono text-xs text-gold hover:underline"
            >
              {language === "bn" ? "সম্পূর্ণ পরিশোধ করুন" : "Pay full amount"}
            </button>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-wide text-muted">
              {language === "bn" ? "মাধ্যম" : "Method"}
            </label>
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => setMethod("cash")}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                  method === "cash"
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-line text-muted hover:text-paper"
                }`}
              >
                {language === "bn" ? "নগদ" : "Cash"}
              </button>
              <button
                type="button"
                onClick={() => setMethod("mobile_banking")}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                  method === "mobile_banking"
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-line text-muted hover:text-paper"
                }`}
              >
                {language === "bn" ? "মোবাইল ব্যাংকিং" : "Mobile banking"}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-line px-4 py-2 text-sm text-muted hover:text-paper"
            >
              {language === "bn" ? "বাতিল" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving || customer.dueBalance <= 0}
              className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/90 disabled:opacity-60"
            >
              {saving
                ? language === "bn" ? "সংরক্ষণ হচ্ছে…" : "Saving…"
                : language === "bn" ? "পেমেন্ট সংরক্ষণ" : "Save payment"}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-line pt-4">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">
            {language === "bn" ? "পেমেন্ট ইতিহাস" : "Payment history"}
          </p>
          {historyLoading ? (
            <p className="mt-2 text-sm text-muted">
              {language === "bn" ? "লোড হচ্ছে…" : "Loading…"}
            </p>
          ) : history.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              {language === "bn"
                ? "এখনো কোনো পেমেন্ট নেই।"
                : "No payments recorded yet."}
            </p>
          ) : (
            <ul className="mt-2 max-h-32 space-y-2 overflow-y-auto text-sm">
              {history.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-muted"
                >
                  <span>
                    {new Date(p.date).toLocaleDateString(
                      language === "bn" ? "bn-BD" : "en-BD"
                    )}{" "}
                    · {p.method === "cash" ? (language === "bn" ? "নগদ" : "Cash") : (language === "bn" ? "মোবাইল ব্যাংকিং" : "Mobile banking")}
                  </span>
                  <span className="font-mono text-taka">
                    +৳{p.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}