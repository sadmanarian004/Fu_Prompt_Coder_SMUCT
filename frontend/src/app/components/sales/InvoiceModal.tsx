"use client";

import { useState } from "react";
import apiClient from "../../../lib/apiClient";
import { useLanguage } from "../../../context/LanguageContext";

export interface SaleItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  paymentType: "paid" | "credit";
  createdAt: string;
}

interface InvoiceModalProps {
  sale: Sale;
  shopName: string;
  onClose: () => void;
}

export default function InvoiceModal({
  sale,
  shopName,
  onClose,
}: InvoiceModalProps) {
  const { language } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(false);
    try {
      const response = await apiClient.get(`/invoices/${sale.id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sale.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // PDF endpoint not live yet — fall back to the browser's print dialog,
      // which can still "print to PDF" for demo purposes.
      setDownloadError(true);
      window.print();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 print:static print:bg-white">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-2xl print:border-0 print:bg-white print:text-black print:shadow-none">
        <div className="flex items-start justify-between print:hidden">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
              {language === "bn" ? "রশিদ" : "Invoice"}
            </p>
            <h2 className="font-display text-lg font-semibold">
              {sale.invoiceNo}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-paper"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 border-t border-dashed border-line pt-4 print:border-black">
          <div className="flex items-center justify-between text-sm">
            <span className="font-display font-semibold">{shopName}</span>
            <span className="font-mono text-xs text-muted print:text-black">
              {new Date(sale.createdAt).toLocaleString(
                language === "bn" ? "bn-BD" : "en-BD"
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted print:text-black">
            {language === "bn" ? "গ্রাহক" : "Customer"}: {sale.customerName}
          </p>
        </div>

        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wide text-muted print:border-black print:text-black">
              <th className="py-2">{language === "bn" ? "পণ্য" : "Item"}</th>
              <th className="py-2 text-right">
                {language === "bn" ? "পরিমাণ" : "Qty"}
              </th>
              <th className="py-2 text-right">
                {language === "bn" ? "মোট" : "Amount"}
              </th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => (
              <tr
                key={i}
                className="border-b border-line/40 last:border-0 print:border-black/20"
              >
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-right font-mono">{item.quantity}</td>
                <td className="py-2 text-right font-mono">
                  ৳{(item.unitPrice * item.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 print:border-black">
          <span className="font-display font-semibold">
            {language === "bn" ? "সর্বমোট" : "Total"}
          </span>
          <span className="font-mono text-lg font-semibold text-gold print:text-black">
            ৳{sale.total.toLocaleString()}
          </span>
        </div>

        <span
          className={`mt-3 inline-block rounded-full border px-2.5 py-0.5 font-mono text-xs print:hidden ${
            sale.paymentType === "paid"
              ? "border-taka/40 bg-taka/10 text-taka"
              : "border-rust/40 bg-rust/10 text-rust"
          }`}
        >
          {sale.paymentType === "paid"
            ? language === "bn" ? "পরিশোধিত" : "Paid in full"
            : language === "bn" ? "বাকি (ক্রেডিট)" : "On credit (baki)"}
        </span>

        {downloadError && (
          <p className="mt-3 text-xs text-muted print:hidden">
            {language === "bn"
              ? "সরাসরি ডাউনলোড লিংক পাওয়া যায়নি — ব্রাউজারের প্রিন্ট ডায়ালগ ব্যবহার করুন।"
              : "PDF service isn't reachable yet — use your browser's print dialog to save as PDF."}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="rounded-md border border-line px-4 py-2 text-sm text-muted hover:text-paper"
          >
            {language === "bn" ? "বন্ধ করুন" : "Close"}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/90 disabled:opacity-60"
          >
            {downloading
              ? language === "bn" ? "প্রস্তুত হচ্ছে…" : "Preparing…"
              : language === "bn" ? "পিডিএফ ডাউনলোড" : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}