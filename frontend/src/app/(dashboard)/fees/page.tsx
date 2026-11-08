"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Receipt,
  Download,
  Filter,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";
import {
  getMockFeeInvoices,
  collectMockFeePayment,
  MockFeeInvoice,
} from "@/services/mockAcademicApi";

export default function FeesPage() {
  const [invoices, setInvoices] = useState<MockFeeInvoice[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<MockFeeInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI / Net Banking");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getMockFeeInvoices()
      .then((data) => {
        if (isMounted) setInvoices(data);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const openPaymentModal = (invoice: MockFeeInvoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentAmount(invoice.amount - invoice.paidAmount);
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoiceForPayment) return;
    setIsSubmittingPayment(true);
    try {
      const res = await collectMockFeePayment({
        invoiceId: selectedInvoiceForPayment.id,
        amount: paymentAmount,
        paymentMethod,
      });

      // Update state locally
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === selectedInvoiceForPayment.id) {
            const newPaid = inv.paidAmount + paymentAmount;
            return {
              ...inv,
              paidAmount: newPaid,
              status: newPaid >= inv.amount ? "PAID" : "PENDING",
              paymentMethod,
              paidAt: new Date().toISOString().split("T")[0],
            };
          }
          return inv;
        })
      );

      toast({
        type: "success",
        title: "Payment Recorded!",
        description: `Receipt #${res.receiptNumber} generated for ${selectedInvoiceForPayment.studentName}.`,
      });

      setSelectedInvoiceForPayment(null);
    } catch (err) {
      toast({
        type: "error",
        title: "Payment Error",
        description: "Failed to record transaction.",
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.studentName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.rollNumber.includes(search);
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBilled = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCollected = invoices.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalOutstanding = totalBilled - totalCollected;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Student Fees & Invoicing <DoodleSpark className="h-6 w-6 text-[#4D9FFF]" />
            </h1>
            <Badge
              variant="outline"
              className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 font-bold px-2.5 py-0.5 text-xs uppercase tracking-wide"
            >
              Demo data
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Manage tuition billing, payment collections, overdue tracking, and receipts
          </p>
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Simulated Academic Module:</strong> Financial billing and payment gateway controllers are scheduled for subsequent iterations. Currently powered by <code>mockAcademicApi.ts</code>.
          </span>
        </div>
        <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 shrink-0">
          Demo data
        </Badge>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow space-y-2">
          <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#4D9FFF]">
            Total Invoiced
          </p>
          <h3 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100">
            ₹{totalBilled.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Across {invoices.length} student billing accounts
          </p>
        </div>

        <div className="rounded-3xl bg-[#EFFFF7] dark:bg-[#0F2D25] p-6 sketch-shadow space-y-2">
          <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#48C78E]">
            Total Collected
          </p>
          <h3 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-[#48C78E]">
            ₹{totalCollected.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {Math.round((totalCollected / (totalBilled || 1)) * 100)}% realization rate
          </p>
        </div>

        <div className="rounded-3xl bg-[#FFF1E8] dark:bg-[#331811] p-6 sketch-shadow space-y-2">
          <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FF8066]">
            Outstanding / Dues
          </p>
          <h3 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-[#FF8066]">
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Pending student installment balances
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4D9FFF]" />
          <input
            type="text"
            placeholder="🔍 Search student, roll number, or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-800 text-xs font-bold sketch-shadow-sm focus:outline-none"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          {["ALL", "PAID", "PENDING", "OVERDUE"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-handwriting transition-all ${
                statusFilter === st
                  ? "bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Invoice #</th>
              <th className="pb-3">Student</th>
              <th className="pb-3">Cohort</th>
              <th className="pb-3">Billing Title</th>
              <th className="pb-3">Due Date</th>
              <th className="pb-3">Total Amount</th>
              <th className="pb-3">Paid / Remaining</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-handwriting text-lg animate-pulse">
                  Loading tuition invoices...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-handwriting text-base">
                  No invoices found matching current criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-4 font-bold font-handwriting text-[#4D9FFF]">
                    {inv.invoiceNo}
                  </td>
                  <td className="py-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {inv.studentName}
                    </div>
                    <div className="text-[11px] text-slate-400">Roll: {inv.rollNumber}</div>
                  </td>
                  <td className="py-4 font-medium text-slate-600 dark:text-slate-300">
                    {inv.className}
                  </td>
                  <td className="py-4 font-semibold text-slate-700 dark:text-slate-200">
                    {inv.title}
                  </td>
                  <td className="py-4 text-slate-500 font-medium">
                    {inv.dueDate}
                  </td>
                  <td className="py-4 font-bold text-slate-900 dark:text-slate-100">
                    ₹{inv.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-4">
                    <span className="font-bold text-emerald-600">
                      ₹{inv.paidAmount.toLocaleString("en-IN")}
                    </span>{" "}
                    /{" "}
                    <span className="font-semibold text-rose-500">
                      ₹{(inv.amount - inv.paidAmount).toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="py-4">
                    <Badge
                      variant={
                        inv.status === "PAID"
                          ? "green"
                          : inv.status === "PENDING"
                          ? "yellow"
                          : "coral"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="py-4 text-right">
                    {inv.status !== "PAID" ? (
                      <Button
                        size="sm"
                        variant="green"
                        onClick={() => openPaymentModal(inv)}
                        className="text-xs font-handwriting gap-1"
                      >
                        <CreditCard className="h-3.5 w-3.5" /> Collect Fee
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast({
                            type: "success",
                            title: "Receipt Printed",
                            description: `Issued receipt for ${inv.invoiceNo}`,
                          });
                        }}
                        className="text-xs font-handwriting gap-1"
                      >
                        <Receipt className="h-3.5 w-3.5" /> Receipt
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Collect Fee Modal */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#141824] p-6 sm:p-8 sketch-shadow space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
                    Collect Fee Installment
                  </h3>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                    Demo data
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Invoice: {selectedInvoiceForPayment.invoiceNo} • {selectedInvoiceForPayment.studentName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-handwriting mb-1 text-slate-800 dark:text-slate-200">
                  Total Outstanding Balance
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-lg font-bold font-handwriting text-rose-600">
                  ₹{(selectedInvoiceForPayment.amount - selectedInvoiceForPayment.paidAmount).toLocaleString("en-IN")}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-handwriting mb-1 text-slate-800 dark:text-slate-200">
                  Payment Collection Amount (₹)
                </label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                  max={selectedInvoiceForPayment.amount - selectedInvoiceForPayment.paidAmount}
                  min={1}
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-handwriting mb-1 text-slate-800 dark:text-slate-200">
                  Payment Mode / Gateway
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="UPI / Net Banking">UPI / Net Banking</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash / Cheque Receipt">Cash / Cheque Receipt</option>
                  <option value="Bank Wire Transfer">Bank Wire Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setSelectedInvoiceForPayment(null)}
              >
                Cancel
              </Button>
              <Button
                variant="green"
                isLoading={isSubmittingPayment}
                onClick={handleProcessPayment}
                className="font-handwriting text-base"
              >
                Confirm & Issue Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

