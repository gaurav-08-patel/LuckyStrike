import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "./ui/Toast";

type BankAccount = {
  id: number;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  branchName: string | null;
  ifscCode: string | null;
  swiftCode: string | null;
  iban: string | null;
  routingNumber: string | null;
  isDefault: boolean;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

type BankAccountForm = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  branchName: string;
  ifscCode: string;
  swiftCode: string;
  iban: string;
  routingNumber: string;
  isDefault: boolean;
};

const initialForm: BankAccountForm = {
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  branchName: "",
  ifscCode: "",
  swiftCode: "",
  iban: "",
  routingNumber: "",
  isDefault: false,
};

export default function BankAccountsTab() {
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BankAccountForm>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => localStorage.getItem("luckyStrikeToken"), []);

  const fetchAccounts = async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/withdrawals/bank-accounts`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to load bank accounts");
      }

      const data = await response.json();
      setAccounts(Array.isArray(data?.bankAccounts) ? data.bankAccounts : []);
    } catch (err: any) {
      setError(err?.message || "Unable to load bank accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleChange = (
    field: keyof BankAccountForm,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const submitBankAccount = async () => {
    if (!user?.id) {
      setError("Not authenticated");
      return;
    }

    const payload = {
      ...(editingId ? { bankAccountId: editingId } : {}),
      accountHolderName: form.accountHolderName.trim(),
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.trim(),
      branchName: form.branchName.trim(),
      ifscCode: form.ifscCode.trim() || undefined,
      swiftCode: form.swiftCode.trim() || undefined,
      iban: form.iban.trim() || undefined,
      routingNumber: form.routingNumber.trim() || undefined,
      isDefault: form.isDefault,
    };

    if (!payload.accountHolderName || !payload.bankName || !payload.accountNumber || !payload.branchName) {
      setError("Account holder name, bank name, account number, and branch name are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/withdrawals/bank-accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseBody?.message || "Unable to save bank account.");
      }

      toast.success(
        editingId ? "Bank account updated" : "Bank account added",
        editingId ? "Your bank details were updated." : "Your bank account was saved successfully.",
      );

      resetForm();
      await fetchAccounts();
    } catch (err: any) {
      setError(err?.message || "Unable to save bank account.");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (account: BankAccount) => {
    setEditingId(account.id);
    setForm({
      accountHolderName: account.accountHolderName || "",
      bankName: account.bankName || "",
      accountNumber: account.accountNumber || "",
      branchName: account.branchName || "",
      ifscCode: account.ifscCode || "",
      swiftCode: account.swiftCode || "",
      iban: account.iban || "",
      routingNumber: account.routingNumber || "",
      isDefault: account.isDefault || false,
    });
  };

  return (
    <div className="space-y-6 rounded-[24px] border border-[#ffe7ec] bg-gradient-to-br from-[#fff7f8] to-[#fffdfa] p-6 shadow-[0_10px_30px_rgba(255,93,160,0.08)]">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-[2rem] font-black text-pink-600">
          Bank accounts
        </h2>
        <p className="text-sm text-ink/70">
          Save your bank details once and use a saved account for future withdrawal requests.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[20px] border border-[#ffe7ec] bg-white p-5 shadow-[0_8px_18px_rgba(255,93,160,0.06)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-display text-[1.5rem] font-black text-pink-600">
              {editingId ? "Edit bank account" : "Add bank account"}
            </h3>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-pink-700"
              >
                Cancel
              </button>
            ) : null}
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-400 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600 md:col-span-2">
              <span>Account holder name</span>
              <input
                value={form.accountHolderName}
                onChange={(event) => handleChange("accountHolderName", event.target.value)}
                className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium normal-case text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                placeholder="Account holder name"
              />
            </label>

            <label className="space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600">
              <span>Bank name</span>
              <input
                value={form.bankName}
                onChange={(event) => handleChange("bankName", event.target.value)}
                className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium normal-case text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                placeholder="Bank name"
              />
            </label>

            <label className="space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600">
              <span>Branch name</span>
              <input
                value={form.branchName}
                onChange={(event) => handleChange("branchName", event.target.value)}
                className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium normal-case text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                placeholder="Branch name"
              />
            </label>

            <label className="space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600 md:col-span-2">
              <span>Account number</span>
              <input
                value={form.accountNumber}
                onChange={(event) => handleChange("accountNumber", event.target.value)}
                className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium normal-case text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                placeholder="Account number"
              />
            </label>

            <label className="space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600">
              <span>IFSC code</span>
              <input
                value={form.ifscCode}
                onChange={(event) => handleChange("ifscCode", event.target.value)}
                className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium normal-case text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                placeholder="IFSC code"
              />
            </label>

            <label className="space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600">
              <span>SWIFT code</span>
              <input
                value={form.swiftCode}
                onChange={(event) => handleChange("swiftCode", event.target.value)}
                className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium normal-case text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                placeholder="SWIFT code"
              />
            </label>

            <label className="space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600 md:col-span-2">
              <span>IBAN</span>
              <input
                value={form.iban}
                onChange={(event) => handleChange("iban", event.target.value)}
                className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium normal-case text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                placeholder="IBAN (optional)"
              />
            </label>

            <label className="space-y-2 text-xs font-black uppercase tracking-[0.08em] text-pink-600 md:col-span-2">
              <span>Routing number</span>
              <input
                value={form.routingNumber}
                onChange={(event) => handleChange("routingNumber", event.target.value)}
                className="mt-1 w-full rounded-md border border-pink-200 bg-[#fffafc] px-3 py-2.5 text-sm font-medium normal-case text-ink outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                placeholder="Routing number (optional)"
              />
            </label>

            <label className="mt-1 flex items-center gap-3 text-xs font-black uppercase tracking-[0.08em] text-pink-600 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) => handleChange("isDefault", event.target.checked)}
                className="h-4 w-4 rounded border-pink-300 accent-[#ff3d8c]"
              />
              Set as default bank account
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={submitBankAccount}
              disabled={saving}
              className="w-full rounded-[14px] border-[3px] border-ink bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_#171310] transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#171310] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {saving ? (editingId ? "Updating..." : "Saving...") : editingId ? "Update bank account" : "Save bank account"}
            </button>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#ffe7ec] bg-white p-5 shadow-[0_8px_18px_rgba(255,93,160,0.06)]">
          <h3 className="font-display text-[1.5rem] font-black text-pink-600">
            Saved accounts
          </h3>

          {loading ? (
            <div className="mt-4 text-sm text-ink/70">Loading bank accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-ink/40 bg-[#fffaf2] p-4 text-sm text-ink/70">
              No bank accounts saved yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`rounded-[18px] border p-4 ${
                    account.isDefault
                      ? "border-pink-300 bg-[#fff0f6]"
                      : "border-[#ffe7ec] bg-[#fffafc]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black uppercase tracking-[0.08em] text-ink">
                        {account.accountHolderName}
                      </p>
                      <p className="mt-1 text-sm text-ink/70">{account.bankName}</p>
                    </div>
                    {account.isDefault ? (
                      <span className="rounded-full border border-[#ff3d8c] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#ff3d8c]">
                        Default
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-ink/80">
                    <div>
                      <span className="font-bold">Account no:</span> {account.accountNumber}
                    </div>
                    {account.branchName ? (
                      <div>
                        <span className="font-bold">Branch:</span> {account.branchName}
                      </div>
                    ) : null}
                    {account.ifscCode ? (
                      <div>
                        <span className="font-bold">IFSC:</span> {account.ifscCode}
                      </div>
                    ) : null}
                    {account.swiftCode ? (
                      <div>
                        <span className="font-bold">SWIFT:</span> {account.swiftCode}
                      </div>
                    ) : null}
                    {account.iban ? (
                      <div>
                        <span className="font-bold">IBAN:</span> {account.iban}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(account)}
                      className="rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-pink-700"
                    >
                      Edit
                    </button>
                    {!account.isDefault ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const payload = {
                            bankAccountId: account.id,
                            accountHolderName: account.accountHolderName,
                            bankName: account.bankName,
                            accountNumber: account.accountNumber,
                            branchName: account.branchName || "",
                            ifscCode: account.ifscCode || "",
                            swiftCode: account.swiftCode || "",
                            iban: account.iban || "",
                            routingNumber: account.routingNumber || "",
                            isDefault: true,
                          };

                          try {
                            const response = await fetch(`${API_BASE_URL}/api/withdrawals/bank-accounts`, {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: token ? `Bearer ${token}` : "",
                              },
                              body: JSON.stringify(payload),
                            });

                            const body = await response.json().catch(() => ({}));
                            if (!response.ok) {
                              throw new Error(body?.message || "Unable to set default bank account.");
                            }

                            toast.success("Default updated", "This account is now your default bank account.");
                            await fetchAccounts();
                          } catch (err: any) {
                            setError(err?.message || "Unable to set default bank account.");
                          }
                        }}
                        className="rounded-md bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-white shadow-sm"
                      >
                        Set default
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
