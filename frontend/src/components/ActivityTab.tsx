import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type WalletTransaction = {
  id: number;
  type: string;
  amount: string | number;
  balance_after: string | number;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
};

type TicketActivityItem = {
  id: number;
  ticketCode: string;
  ticketStatus: string;
  createdAt: string;
  draw: {
    id: number;
    drawCode: string;
    title: string;
    prizeTitle: string;
    prizeAmount: number;
    drawStatus: string;
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  if (!value) return "";

  const normalized =
    value.includes("T") || value.includes(" ")
      ? value.replace(" ", "T")
      : value;

  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const date = new Date(hasExplicitTimezone ? normalized : `${normalized}Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function ActivityTab() {
  const [recentTransactions, setRecentTransactions] = useState<
    WalletTransaction[]
  >([]);
  const [recentTickets, setRecentTickets] = useState<TicketActivityItem[]>([]);
  const [recentWins, setRecentWins] = useState<TicketActivityItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("luckyStrikeToken");
    if (!token) {
      setRecentTransactions([]);
      setRecentTickets([]);
      setRecentWins([]);
      return;
    }

    const fetchActivity = async () => {
      setIsLoadingActivity(true);

      try {
        const [transactionsResponse, ticketsResponse, winsResponse] =
          await Promise.all([
            fetch(`${API_BASE_URL}/api/wallet/transactions?limit=5&offset=0`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_BASE_URL}/api/my-tickets?status=all`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_BASE_URL}/api/my-tickets?status=won`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        const transactionsData = transactionsResponse.ok
          ? ((await transactionsResponse.json()) as {
              transactions?: WalletTransaction[];
            })
          : { transactions: [] };

        const ticketsData = ticketsResponse.ok
          ? ((await ticketsResponse.json()) as {
              tickets?: TicketActivityItem[];
            })
          : { tickets: [] };

        const winsData = winsResponse.ok
          ? ((await winsResponse.json()) as {
              tickets?: TicketActivityItem[];
            })
          : { tickets: [] };

        setRecentTransactions(
          (transactionsData.transactions ?? []).slice(0, 5),
        );
        setRecentTickets((ticketsData.tickets ?? []).slice(0, 5));
        setRecentWins((winsData.tickets ?? []).slice(0, 5));
      } catch (error) {
        console.warn("Activity data failed to load:", error);
        setRecentTransactions([]);
        setRecentTickets([]);
        setRecentWins([]);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    void fetchActivity();
  }, []);

  return (
    <div className="rounded-[24px] border-[3px] border-ink bg-[#f4fef7] p-6 shadow-[5px_5px_0_#171310]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[2rem] uppercase leading-none tracking-[-0.05em] text-ink">
            Activity
          </h2>
          <p className="mt-2 text-sm text-ink/70">
            Your recent wallet activity, ticket purchases, and wins.
          </p>
        </div>
      </div>

      {isLoadingActivity ? (
        <div className="rounded-[18px] border-[2px] border-dashed border-ink/25 bg-white/60 p-5 text-sm text-ink/60">
          Loading recent activity...
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[20px] border-[2px] border-ink bg-white p-4 shadow-[3px_3px_0_#171310]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-black uppercase tracking-[0.08em] text-ink">
                Transactions
              </h3>
              <Link
                to="/wallet"
                className="rounded-full border-[2px] border-ink bg-[#ff3d8c] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[2px_2px_0_#171310] transition hover:-translate-y-0.5"
              >
                View all
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="rounded-[14px] border-[2px] border-dashed border-ink/25 bg-[#fffaf7] p-4 text-sm text-ink/60">
                No transaction history yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((item) => {
                  const amount = Number(item.amount ?? 0);
                  const isCredit = amount >= 0;

                  return (
                    <div
                      key={item.id}
                      className="rounded-[14px] border-[2px] border-ink/10 bg-[#fffaf7] p-3"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.06em] text-ink/70">
                        <span>{item.type || "Transaction"}</span>
                        <span
                          className={
                            isCredit ? "text-[#16714a]" : "text-[#a92525]"
                          }
                        >
                          {isCredit ? "+" : "-"}
                          {formatCurrency(Math.abs(amount))}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] text-ink/60">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[20px] border-[2px] border-ink bg-white p-4 shadow-[3px_3px_0_#171310]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-black uppercase tracking-[0.08em] text-ink">
                Recent tickets
              </h3>
              <Link
                to="/my-tickets"
                className="rounded-full border-[2px] border-ink bg-[#2d6df6] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[2px_2px_0_#171310] transition hover:-translate-y-0.5"
              >
                View all
              </Link>
            </div>

            {recentTickets.length === 0 ? (
              <div className="rounded-[14px] border-[2px] border-dashed border-ink/25 bg-[#f4f9ff] p-4 text-sm text-ink/60">
                No recent ticket purchases yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[14px] border-[2px] border-ink/10 bg-[#f4f9ff] p-3"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.06em] text-ink/70">
                      <span>{item.ticketCode}</span>
                      <span className="rounded-full border-[2px] border-[#dca400] bg-[#fff1b8] px-2 py-0.5 text-[10px] text-[#7d5600]">
                        {item.ticketStatus}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {item.draw?.title || "Lucky Strike ticket"}
                    </p>
                    <p className="mt-1 text-[12px] text-ink/60">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[20px] border-[2px] border-ink bg-white p-4 shadow-[3px_3px_0_#171310]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-black uppercase tracking-[0.08em] text-ink">
                Recent wins
              </h3>
              <Link
                to="/my-tickets?status=won"
                className="rounded-full border-[2px] border-ink bg-[#18a45b] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[2px_2px_0_#171310] transition hover:-translate-y-0.5"
              >
                View all
              </Link>
            </div>

            {recentWins.length === 0 ? (
              <div className="rounded-[14px] border-[2px] border-dashed border-ink/25 bg-[#f3fff7] p-4 text-sm text-ink/60">
                No recent wins yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentWins.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[14px] border-[2px] border-ink/10 bg-[#f3fff7] p-3"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.06em] text-ink/70">
                      <span>{item.ticketCode}</span>
                      <span className="text-[#16714a]">
                        {formatCurrency(item.draw?.prizeAmount ?? 0)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {item.draw?.title || "Lucky Strike win"}
                    </p>
                    <p className="mt-1 text-[12px] text-ink/60">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityTab;
