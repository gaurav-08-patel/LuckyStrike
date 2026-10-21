import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "./ui/Toast";

type BankAccount = {
  id: number;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  bankCountry?: string | null;
  branchName?: string | null;
  ifscCode?: string | null;
  swiftCode?: string | null;
  iban?: string | null;
  isDefault?: boolean;
  isVerified?: boolean;
};

type WithdrawalRequest = {
  id: number;
  amount: number;
  currency: string;
  status: string;
  requestNote: string | null;
  rejectionReason?: string | null;
  adminNote?: string | null;
  createdAt: string | Date | null;
  updatedAt?: string | Date | null;
  bankAccount: {
    accountHolderName: string | null;
    bankName: string | null;
    accountNumber: string | null;
    bankCountry?: string | null;
    ifscCode?: string | null;
  };
};

type WithdrawalForm = {
  bankAccountId: string;
  amount: string;
  note: string;
};

const initialForm: WithdrawalForm = {
  bankAccountId: "",
  amount: "",
  note: "",
};

const getStatusClasses = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-[#fff4c7] text-[#8a5a00] border border-[#f1d671]";
    case "approved":
      return "bg-[#dff8eb] text-[#0b7a4b] border border-[#9dddb2]";
    case "rejected":
      return "bg-[#ffe6e6] text-[#9d1f1f] border border-[#f1b2b2]";
    case "paid":
      return "bg-[#e5edff] text-[#1d4ed8] border border-[#adc1ff]";
    default:
      return "bg-[#f3f4f6] text-[#444] border border-[#d1d5db]";
  }
};

export default function WithdrawalsTab() {
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<WithdrawalForm>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => localStorage.getItem("luckyStrikeToken"), []);

  const fetchBankAccounts = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/withdrawals/bank-accounts`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to load bank accounts.");
      }

      const data = await response.json();
      setBankAccounts(Array.isArray(data?.bankAccounts) ? data.bankAccounts : []);
    } catch (err: any) {
      setError(err?.message || "Unable to load your saved bank accounts.");
    }
  };

  const fetchRequests = async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/withdrawals/my-requests`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to load withdrawal history.");
      }

      const data = await response.json();
      setRequests(Array.isArray(data?.requests) ? data.requests : []);
    } catch (err: any) {
      setError(err?.message || "Unable to load withdrawal history.");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    await Promise.all([fetchBankAccounts(), fetchRequests()]);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async () => {
    if (!user?.id) {
      setError("You must be logged in to submit a withdrawal request.");
      return;
    }

    const bankAccountId = Number(form.bankAccountId);
    const amount = Number(form.amount);

    if (!Number.isInteger(bankAccountId) || bankAccountId <= 0) {
      setError("Please choose a saved bank account.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Withdrawal amount must be greater than 0.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/withdrawals/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          bankAccountId,
          amount,
          note: form.note.trim() || undefined,
        }),
      });

      const responseBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseBody?.message || "Unable to submit withdrawal request.");
      }

      toast.success("Withdrawal request submitted", "Your withdrawal request has been created.");
      setForm(initialForm);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Unable to submit withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBankAccount = bankAccounts.find(
    (account) => String(account.id) === form.bankAccountId,
  );

  return (
    <div className="space-y-6 rounded-[24px] border border-[#ffe7ec] bg-gradient-to-br from-[#fff7f8] to-[#fffdfa] p-6 shadow-[0_10px_30px_rgba(255,93,160,0.08)]">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-[2rem] font-black text-pink-600">Withdrawals</h2>
        <p className="text-sm text-ink/70">
          Choose one of your saved accounts and submit a withdrawal request.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.4fr]">
        <div className="rounded-[20px] border border-[#ffe7ec] bg-white p-5 shadow-[0_8px_18px_rgba(255,93,160,0.06)]">
          <h3 className="mb-4 font-display text-[1.5rem] font-black text-pink-600">
            New withdrawal
          </h3>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-400 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {bankAccounts.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-pink-200 bg-[#fffafc] p-4 text-sm text-ink/70">
              No saved bank accounts yet. Add one in the Bank Accounts tab first.
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600">
                <span>Bank account</span>
                <select
                  value={form.bankAccountId}
                  onChange={(event) => setForm((current) => ({ ...current, bankAccountId: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                >
                  <option value="">Select a saved account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountHolderName} • {account.bankName} • {account.accountNumber}
                    </option>
                  ))}
                </select>
              </label>

              {selectedBankAccount ? (
                <div className="rounded-[18px] border border-[#ffe7ec] bg-[#fffafc] p-3 text-sm text-ink/70">
                  <div className="font-black uppercase tracking-[0.06em] text-pink-600">
                    {selectedBankAccount.accountHolderName}
                  </div>
                  <div>{selectedBankAccount.bankName}</div>
                  <div>{selectedBankAccount.accountNumber}</div>
                </div>
              ) : null}

              <label className="block space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600">
                <span>Amount</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="Enter amount"
                  className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600">
                <span>Note (optional)</span>
                <textarea
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  rows={4}
                  placeholder="Add an optional note for the admin"
                  className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || bankAccounts.length === 0}
                className="w-full rounded-[12px] bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit withdrawal request"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-[20px] border border-[#ffe7ec] bg-white p-5 shadow-[0_8px_18px_rgba(255,93,160,0.06)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-display text-[1.5rem] font-black text-pink-600">History</h3>
            <button
              type="button"
              onClick={loadData}
              className="rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-pink-700"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-ink/70">Loading withdrawal history...</div>
          ) : requests.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-pink-200 bg-[#fffafc] p-4 text-sm text-ink/70">
              No withdrawal requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[18px] border border-[#ffe7ec]">
              <table className="min-w-full divide-y divide-[#ffe7ec] text-left text-sm">
                <thead className="bg-[#fff7f8] text-pink-700">
                  <tr>
                    <th className="px-3 py-3 font-black uppercase tracking-[0.08em]">ID</th>
                    <th className="px-3 py-3 font-black uppercase tracking-[0.08em]">Amount</th>
                    <th className="px-3 py-3 font-black uppercase tracking-[0.08em]">Bank</th>
                    <th className="px-3 py-3 font-black uppercase tracking-[0.08em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ffe7ec] bg-white">
                  {requests.map((request) => (
                    <tr key={request.id} className="align-top">
                      <td className="px-3 py-3 font-bold text-ink">#{request.id}</td>
                      <td className="px-3 py-3 text-ink">
                        <div className="font-black">₹{Number(request.amount).toFixed(2)}</div>
                        <div className="text-xs text-ink/60">
                          {new Date(request.createdAt ?? Date.now()).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-ink/75">
                        <div className="font-medium">{request.bankAccount?.bankName || "-"}</div>
                        <div className="text-xs">{request.bankAccount?.accountNumber || "-"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getStatusClasses(request.status)}`}
                        >
                          {request.status}
                        </span>
                        {request.status?.toLowerCase() === "rejected" && (request.rejectionReason || request.adminNote) ? (
                          <div className="mt-2 max-w-[240px] rounded-md border border-red-100 bg-red-50 p-2 text-[11px] text-red-700">
                            <span className="font-black uppercase tracking-[0.06em]">Reason:</span>{" "}
                            {request.rejectionReason || request.adminNote}
                          </div>
                        ) : null}
                        {request.requestNote && request.status?.toLowerCase() !== "rejected" ? (
                          <div className="mt-2 max-w-[220px] text-xs text-ink/60">{request.requestNote}</div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
