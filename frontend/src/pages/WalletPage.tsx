import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const presetAmounts = [50, 250, 500, 1000, 2000];
const walletCurrencyCode = "INR";

type WalletTab = "topup" | "history";

type WalletTransaction = {
  id: number;
  user_id: number;
  type: string;
  amount: string;
  balance_after: string;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: walletCurrencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

function toLocalTime(utcValue: string) {
  if (!utcValue) {
    return "";
  }

  const normalizedValue =
    utcValue.includes("T") || utcValue.includes(" ")
      ? utcValue.replace(" ", "T")
      : utcValue;

  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalizedValue);
  const date = new Date(
    hasExplicitTimezone ? normalizedValue : `${normalizedValue}Z`,
  );

  if (Number.isNaN(date.getTime())) {
    return utcValue;
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDateTime(value: string) {
  return toLocalTime(value);
}

function WalletPage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<WalletTab>("topup");
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<"netbanking">("netbanking");
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(10);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [isProcessingTopup, setIsProcessingTopup] = useState(false);
  const [topupError, setTopupError] = useState("");

  const walletBalance = Number(user?.walletBalance ?? 0);

  useEffect(() => {
    const fetchWalletHistory = async (offset = 0, append = false) => {
      const token = localStorage.getItem("luckyStrikeToken");

      if (!token) {
        setWalletHistory([]);
        setHasMoreHistory(false);
        setLoadingHistory(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/wallet/transactions?limit=${append ? 8 : 10}&offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load wallet history");
        }

        const payload = (await response.json()) as
          | {
              transactions?: WalletTransaction[];
              total?: number;
              hasMore?: boolean;
            }
          | WalletTransaction[];

        const transactions = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.transactions)
            ? payload.transactions
            : [];

        setWalletHistory((current) =>
          append ? [...current, ...transactions] : transactions,
        );

        const nextHasMore = Array.isArray(payload)
          ? payload.length > (append ? offset + transactions.length : 10)
          : Boolean(payload.hasMore);

        setHasMoreHistory(nextHasMore);
      } catch (error) {
        console.warn("Wallet history unavailable:", error);
        setWalletHistory([]);
        setHasMoreHistory(false);
      } finally {
        setLoadingHistory(false);
      }
    };

    void fetchWalletHistory(0, false);
  }, []);

  const visibleHistory = useMemo(
    () => walletHistory.slice(0, visibleHistoryCount),
    [walletHistory, visibleHistoryCount],
  );

  const activeAmount = useMemo(() => {
    if (customAmount.trim()) {
      const parsed = Number(customAmount);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return selectedAmount;
  }, [customAmount, selectedAmount]);

  const formattedAmount = formatCurrency(activeAmount);

  const handleConfirmTopup = async () => {
    const amount = Number(activeAmount);

    if (!Number.isFinite(amount) || amount < 50) {
      setTopupError("Please enter a valid amount of at least INR 50.");
      return;
    }

    const token = localStorage.getItem("luckyStrikeToken");

    if (!token) {
      setTopupError("Please log in to continue with the top-up.");
      return;
    }

    try {
      setIsProcessingTopup(true);
      setTopupError("");

      const response = await fetch(`${API_BASE_URL}/api/wallet/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        walletBalance?: number;
        balance?: number;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Top-up failed. Please try again.");
      }

      const updatedBalance = Number(
        payload.walletBalance ?? payload.balance ?? user?.walletBalance ?? 0,
      );

      setUser(
        {
          ...(user ?? {}),
          walletBalance: updatedBalance,
        },
        token,
      );

      const nextTransaction: WalletTransaction = {
        id: Date.now(),
        user_id: Number(user?.id ?? 0),
        type: "topup",
        amount: String(amount),
        balance_after: String(updatedBalance),
        reference_type: "topup",
        reference_id: null,
        created_at: new Date().toISOString(),
      };

      setWalletHistory((current) => [nextTransaction, ...current]);
      setSelectedAmount(50);
      setCustomAmount("");
      setIsTopupModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while processing the top-up.";
      setTopupError(message);
    } finally {
      setIsProcessingTopup(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eae7e5] text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
      />

      <section className="mx-auto max-w-[1400px] px-3 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <h1 className="font-display text-[2.7rem] uppercase leading-[0.9] tracking-[-0.04em] text-ink sm:text-5xl lg:text-6xl">
            Wallet
          </h1>

          <div className="flex w-full max-w-xl gap-2 rounded-[18px] border-[3px] border-ink bg-[#f5f3f1] p-2 shadow-[3px_3px_0_#171310]">
            {[
              { key: "topup", label: "Top up" },
              { key: "history", label: "Wallet History" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as WalletTab)}
                className={`flex-1 rounded-[12px] border-[3px] border-ink px-4 py-3 text-center font-display text-base uppercase tracking-[0.08em] transition-all duration-150 ${
                  activeTab === tab.key
                    ? "bg-[#2d59f3] text-white shadow-[3px_3px_0_#171310]"
                    : "bg-[#f7f7f7] text-ink shadow-[2px_2px_0_#d7d2cf]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border-[3px] border-ink bg-[linear-gradient(135deg,#ff3c8c_0%,#ff5f8f_30%,#ff2b74_100%)] p-4 shadow-[8px_8px_0_#171310] sm:rounded-[34px] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_26%)]" />
          <div className="relative">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-white/80 sm:text-base">
              Wallet balance
            </p>
            <div className="mt-3 flex items-end gap-2 text-3xl font-black text-white sm:gap-3 sm:text-5xl lg:text-[4rem]">
              <span className="font-display tracking-[0.02em]">
                {walletCurrencyCode}
              </span>
              <span className="font-display tracking-[-0.02em]">
                {formatCurrency(walletBalance)
                  .replace(walletCurrencyCode, "")
                  .trim()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 min-h-[460px] overflow-hidden rounded-[22px] border-[3px] border-ink bg-[#f5f3f1] shadow-[6px_6px_0_#171310] sm:mt-8 sm:min-h-[520px] sm:rounded-[26px]">
          {activeTab === "topup" ? (
            <div className="grid min-h-[460px] gap-4 p-3 sm:min-h-[520px] sm:gap-6 sm:p-6 lg:grid-cols-2">
              <div className="rounded-[20px] border-[3px] border-ink bg-[#f7f7f7] p-3 sm:rounded-[26px] sm:p-5">
                <div className="mb-4 sm:mb-5">
                  <h2 className="font-display text-[1.4rem] uppercase leading-[0.95] tracking-[-0.02em] text-ink sm:text-[1.9rem]">
                    Select top-up amount
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
                  {presetAmounts.map((amount) => {
                    const isSelected =
                      !customAmount && selectedAmount === amount;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount("");
                        }}
                        className={`rounded-[16px] border-[3px] p-3 text-center font-display text-[0.9rem] uppercase tracking-[-0.04em] transition-all duration-150 sm:rounded-[18px] sm:p-4 sm:text-[1.1rem] ${
                          isSelected
                            ? "border-[#2d59f3] bg-[linear-gradient(180deg,#ffffff_0%,#eef3ff_100%)] text-ink shadow-[4px_4px_0_#171310]"
                            : "border-[#d7d2cf] bg-white text-ink/80 shadow-[3px_3px_0_#d7d2cf] hover:border-[#2d59f3]"
                        }`}
                      >
                        {walletCurrencyCode} {amount.toLocaleString("en-IN")}
                      </button>
                    );
                  })}
                </div>

                <label className="mt-5 block sm:mt-6">
                  <span className="mb-2 block text-sm font-medium italic text-ink/70 sm:text-lg">
                    or enter an amount (Min INR 50)
                  </span>
                  <input
                    type="number"
                    min={50}
                    value={customAmount}
                    onChange={(event) => {
                      setCustomAmount(event.target.value);
                      if (event.target.value.trim()) {
                        setSelectedAmount(50);
                      }
                    }}
                    placeholder="Enter amount"
                    className="h-[52px] w-full rounded-[16px] border-[3px] border-ink bg-white px-4 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-[#ff3c8c] focus:bg-[#fffdfd] sm:h-[60px] sm:rounded-[18px] sm:text-lg"
                  />
                </label>
              </div>

              <div className="rounded-[20px] border-[3px] border-ink bg-[#f7f7f7] p-3 sm:rounded-[26px] sm:p-5">
                <div className="mb-4 sm:mb-5">
                  <h2 className="font-display text-[1.4rem] uppercase leading-[0.95] tracking-[-0.02em] text-ink sm:text-[1.9rem]">
                    Payment method
                  </h2>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("netbanking")}
                    className={`flex w-full items-center justify-between gap-3 rounded-[16px] border-[3px] p-3 text-left transition-all sm:rounded-[18px] sm:p-4 ${
                      paymentMethod === "netbanking"
                        ? "border-[#2d59f3] bg-[linear-gradient(180deg,#ffffff_0%,#edf3ff_100%)] shadow-[4px_4px_0_#171310]"
                        : "border-[#d7d2cf] bg-white hover:border-[#2d59f3]"
                    }`}
                  >
                    <div>
                      <div className="text-base font-black text-ink sm:text-lg">
                        Netbanking / Online Banking
                      </div>
                      <div className="mt-1 text-xs font-medium text-ink/70 sm:text-sm">
                        Bank transfer, UPI and secure online payment gateway
                      </div>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink bg-[#fff] text-lg font-black text-ink sm:h-10 sm:w-10 sm:text-xl">
                      {paymentMethod === "netbanking" ? "✓" : "+"}
                    </span>
                  </button>

                  <div className="mt-5 rounded-[16px] border-[3px] border-ink bg-[#fff7dc] px-3 py-3 shadow-[3px_3px_0_#171310] sm:mt-6 sm:px-4 sm:py-4">
                    <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.08em] text-ink/70 sm:text-sm">
                      <span>Curr. balance</span>
                      <span>{formatCurrency(walletBalance)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-base font-black text-ink sm:text-lg">
                      <span>Top-up</span>
                      <span>{formattedAmount}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTopupError("");
                      setIsTopupModalOpen(true);
                    }}
                    className="mt-4 flex h-[58px] w-full items-center justify-center rounded-[16px] border-[3px] border-ink bg-[linear-gradient(135deg,#ff3c8c_0%,#ff6b3d_100%)] text-center font-display text-[1.3rem] uppercase tracking-[0.08em] text-white shadow-[5px_5px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[linear-gradient(135deg,#ff2e7f_0%,#ff7a38_100%)] hover:shadow-[7px_7px_0_#171310] active:translate-y-0 active:shadow-[3px_3px_0_#171310] sm:h-[72px] sm:rounded-[18px] sm:text-[1.7rem]"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-[460px] p-3 sm:min-h-[520px] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
                <h2 className="font-display text-[1.4rem] uppercase leading-[0.95] tracking-[-0.02em] text-ink sm:text-[1.9rem]">
                  Wallet history
                </h2>
                <span className="rounded-full border-[3px] border-ink bg-[#f6d857] px-2 py-1 text-[0.55rem] font-black uppercase tracking-[0.18em] text-ink sm:px-3 sm:text-[0.65rem]">
                  {loadingHistory
                    ? "Loading..."
                    : `${walletHistory.length} entries`}
                </span>
              </div>

              {loadingHistory ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-[18px] border-[3px] border-ink bg-white p-6 text-center text-xs font-bold uppercase tracking-[0.12em] text-ink/70 sm:min-h-[360px] sm:text-sm">
                  Loading wallet history...
                </div>
              ) : walletHistory.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-[18px] border-[3px] border-ink bg-white p-6 text-center text-xs font-bold uppercase tracking-[0.12em] text-ink/70 sm:min-h-[360px] sm:text-sm">
                  No transactions yet
                </div>
              ) : (
                <div className="overflow-hidden rounded-[22px] border-[3px] border-ink bg-white">
                  <div className="hidden grid-cols-[1.2fr_0.9fr_1fr_0.9fr_0.9fr] gap-3 border-b-[3px] border-ink bg-[#f3f0ef] px-4 py-3 text-[0.7rem] font-black uppercase tracking-[0.12em] text-ink/70 sm:grid">
                    <span>Date</span>
                    <span>Type</span>
                    <span>Reference</span>
                    <span>Balance after</span>
                    <span className="text-right">Amount</span>
                  </div>

                  <div className="divide-y-[3px] divide-ink/10">
                    {visibleHistory.map((transaction) => {
                      const amountValue = Number(transaction.amount || 0);
                      const balanceAfterValue = Number(
                        transaction.balance_after || 0,
                      );
                      const referenceValue =
                        transaction.reference_id !== null &&
                        transaction.reference_type
                          ? `${transaction.reference_type} #${transaction.reference_id}`
                          : transaction.reference_type || "N/A";
                      const displayType =
                        transaction.type === "topup"
                          ? "Top-up"
                          : transaction.type === "prize_credit"
                            ? "Prize credit"
                            : transaction.type.replace(/_/g, " ");

                      return (
                        <div
                          key={transaction.id}
                          className="grid gap-3 px-4 py-4 sm:grid-cols-[1.2fr_0.9fr_1fr_0.9fr_0.9fr] sm:items-center"
                        >
                          <div>
                            <div className="text-sm font-bold text-ink">
                              {formatDateTime(transaction.created_at)}
                            </div>
                          </div>

                          <div className="text-sm font-bold text-ink">
                            {displayType}
                          </div>

                          <div className="text-sm font-bold text-ink/75">
                            {referenceValue}
                          </div>

                          <div className="text-sm font-bold text-ink/75">
                            {formatCurrency(balanceAfterValue)}
                          </div>

                          <div
                            className={`text-right text-base font-black ${
                              amountValue >= 0
                                ? "text-[#1b9d61]"
                                : "text-[#d03552]"
                            }`}
                          >
                            {amountValue >= 0 ? "+" : "-"}
                            {formatCurrency(Math.abs(amountValue))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(hasMoreHistory ||
                    walletHistory.length > visibleHistoryCount) && (
                    <div className="border-t-[3px] border-ink bg-[#f3f0ef] p-3 sm:p-4">
                      <button
                        type="button"
                        onClick={async () => {
                          if (loadingHistory) {
                            return;
                          }

                          const nextOffset = walletHistory.length;
                          setLoadingHistory(true);

                          const token =
                            localStorage.getItem("luckyStrikeToken");

                          if (!token) {
                            setLoadingHistory(false);
                            return;
                          }

                          try {
                            const response = await fetch(
                              `${API_BASE_URL}/api/wallet/transactions?limit=8&offset=${nextOffset}`,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                              },
                            );

                            if (!response.ok) {
                              throw new Error(
                                "Failed to load more wallet history",
                              );
                            }

                            const payload = (await response.json()) as {
                              transactions?: WalletTransaction[];
                              hasMore?: boolean;
                            };

                            const moreTransactions = Array.isArray(
                              payload.transactions,
                            )
                              ? payload.transactions
                              : [];

                            setWalletHistory((current) => [
                              ...current,
                              ...moreTransactions,
                            ]);
                            setHasMoreHistory(Boolean(payload.hasMore));
                            setVisibleHistoryCount(
                              (current) => current + moreTransactions.length,
                            );
                          } catch (error) {
                            console.warn(
                              "Wallet history pagination failed:",
                              error,
                            );
                          } finally {
                            setLoadingHistory(false);
                          }
                        }}
                        className="w-full rounded-[14px] border-[3px] border-ink bg-white px-4 py-3 text-center font-display text-base uppercase tracking-[0.08em] text-ink shadow-[3px_3px_0_#171310] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#fff7dc] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={loadingHistory}
                      >
                        {loadingHistory ? "Loading..." : "Show more"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {isTopupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171310]/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[24px] border-[3px] border-ink bg-[#fffaf7] p-5 shadow-[8px_8px_0_#171310] sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-ink/60">
                  Confirm top-up
                </p>
                <h3 className="mt-2 font-display text-[2rem] uppercase leading-none tracking-[-0.05em] text-ink">
                  {formattedAmount}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsTopupModalOpen(false);
                  setTopupError("");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-ink bg-white text-lg font-black text-ink shadow-[3px_3px_0_#171310]"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="rounded-[18px] border-[3px] border-ink bg-[#fff7dc] p-3 text-sm font-medium text-ink/80 shadow-[3px_3px_0_#171310]">
              This top-up is only for development purposes. It will be replaced
              later with a real payment gateway integration.
            </div>

            {topupError && (
              <div className="mt-3 rounded-[12px] border-[2px] border-[#d03552] bg-[#ffe8ec] px-3 py-2 text-sm font-medium text-[#8d1d2f]">
                {topupError}
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsTopupModalOpen(false);
                  setTopupError("");
                }}
                className="flex-1 rounded-[14px] border-[3px] border-ink bg-white px-4 py-3 text-center font-display text-base uppercase tracking-[0.08em] text-ink shadow-[3px_3px_0_#171310] transition-all hover:-translate-y-0.5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmTopup}
                disabled={isProcessingTopup}
                className="flex-1 rounded-[14px] border-[3px] border-ink bg-[linear-gradient(135deg,#ff3c8c_0%,#ff6b3d_100%)] px-4 py-3 text-center font-display text-base uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#171310] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isProcessingTopup ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default WalletPage;
