import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type OverviewSummary = {
  totalUsers: number;
  activeDraws: number;
  ticketsSoldLast7Days: number;
  openSupportRequests: number;
  walletVolumeLast30Days: number;
};

type ActiveDrawItem = {
  id: number;
  drawCode: string;
  title: string;
  prizeTitle: string;
  prizeAmount: number;
  ticketPrice: number;
  maxTickets: number;
  ticketsSold: number;
  drawAt: string;
  expiresAt: string;
  status: string;
};

type RecentTicketPurchaseItem = {
  id: number;
  ticketCode: string;
  userId: number;
  userName: string;
  drawCode: string;
  drawTitle: string;
  prizeAmount: number;
  ticketPrice: number;
  createdAt: string;
};

type RecentWinnerItem = {
  id: number;
  drawCode: string;
  winnerName: string;
  prizeAmount: number;
  announcedAt: string;
  drawTitle: string;
};

type RecentSupportRequestItem = {
  id: number;
  issueType: string;
  subject: string;
  status: string;
  createdAt: string;
  userName: string;
};

type AdminOverviewResponse = {
  summary?: Partial<OverviewSummary>;
  activeDraws?: ActiveDrawItem[];
  recentTicketPurchases?: RecentTicketPurchaseItem[];
  recentWinners?: RecentWinnerItem[];
  recentSupportRequests?: RecentSupportRequestItem[];
};

const emptySummary: OverviewSummary = {
  totalUsers: 0,
  activeDraws: 0,
  ticketsSoldLast7Days: 0,
  openSupportRequests: 0,
  walletVolumeLast30Days: 0,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  if (!value) return "-";

  const normalized =
    value.includes("T") || value.includes(" ") ? value.replace(" ", "T") : value;
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

function getStatusBadgeClass(status: string) {
  const normalized = status.trim().toLowerCase();

  if (["active", "received", "in_review"].includes(normalized)) {
    return "border-[3px] border-ink bg-yellow text-ink";
  }
  if (["completed", "resolved", "closed"].includes(normalized)) {
    return "border-[3px] border-ink bg-pink text-white";
  }
  if (["lost", "expired"].includes(normalized)) {
    return "border-[3px] border-ink bg-red text-white";
  }

  return "border-[3px] border-ink bg-paper text-ink";
}

export default function AdminOverviewTab() {
  const [summary, setSummary] = useState<OverviewSummary>(emptySummary);
  const [activeDraws, setActiveDraws] = useState<ActiveDrawItem[]>([]);
  const [recentTicketPurchases, setRecentTicketPurchases] = useState<
    RecentTicketPurchaseItem[]
  >([]);
  const [recentWinners, setRecentWinners] = useState<RecentWinnerItem[]>([]);
  const [recentSupportRequests, setRecentSupportRequests] = useState<
    RecentSupportRequestItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const statCards = useMemo(
    () => [
      {
        label: "Total users",
        value: summary.totalUsers.toLocaleString("en-IN"),
        tone: "bg-yellow-tint",
      },
      {
        label: "Active draws",
        value: summary.activeDraws.toLocaleString("en-IN"),
        tone: "bg-pink-tint",
      },
      {
        label: "Tickets sold (7 days)",
        value: summary.ticketsSoldLast7Days.toLocaleString("en-IN"),
        tone: "bg-warm",
      },
      {
        label: "Open support",
        value: summary.openSupportRequests.toLocaleString("en-IN"),
        tone: "bg-[#fff1f0]",
      },
      {
        label: "Wallet volume (30 days)",
        value: formatCurrency(summary.walletVolumeLast30Days),
        tone: "bg-[#fff6df]",
      },
    ],
    [summary],
  );

  useEffect(() => {
    const token = localStorage.getItem("luckyStrikeToken");

    if (!token) {
      setErrorMessage("You are not authenticated.");
      setIsLoading(false);
      return;
    }

    const fetchOverview = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/overview`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await response.json()) as AdminOverviewResponse & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message || "Unable to load admin overview.");
        }

        const nextSummary = data.summary ?? {};
        setSummary({
          totalUsers: Number(nextSummary.totalUsers ?? 0),
          activeDraws: Number(nextSummary.activeDraws ?? 0),
          ticketsSoldLast7Days: Number(nextSummary.ticketsSoldLast7Days ?? 0),
          openSupportRequests: Number(nextSummary.openSupportRequests ?? 0),
          walletVolumeLast30Days: Number(nextSummary.walletVolumeLast30Days ?? 0),
        });
        setActiveDraws(data.activeDraws ?? []);
        setRecentTicketPurchases(data.recentTicketPurchases ?? []);
        setRecentWinners(data.recentWinners ?? []);
        setRecentSupportRequests(data.recentSupportRequests ?? []);
      } catch (error) {
        setSummary(emptySummary);
        setActiveDraws([]);
        setRecentTicketPurchases([]);
        setRecentWinners([]);
        setRecentSupportRequests([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load admin overview data.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOverview();
  }, []);

  return (
    <div className="rounded-[24px] border-[3px] border-ink bg-warm p-5 shadow-[6px_6px_0_#171310] sm:p-6">
      <div className="mb-5 rounded-[18px] border-[3px] border-ink bg-paper px-4 py-4 shadow-[3px_3px_0_#171310]">
        <p className="text-sm font-bold text-pink">
          Admin dashboard
        </p>
        <h2 className="mt-2 font-display text-[2rem] leading-none tracking-[-0.05em] text-ink">
          Overview
        </h2>
        <p className="mt-2 text-sm text-ink/70">
          Quick operational summary across users, draws, sales, winners, and
          support.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-[18px] border-[3px] border-ink bg-paper p-5 text-sm text-ink/60 shadow-[3px_3px_0_#171310]">
          Loading overview...
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <div className="rounded-[18px] border-[3px] border-ink bg-[#ffe8e8] p-4 text-sm text-[#9a2f2f] shadow-[3px_3px_0_#171310]">
          {errorMessage}
        </div>
      ) : null}

      {!isLoading && !errorMessage ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {statCards.map((item) => (
              <div
                key={item.label}
                className={`rounded-[16px] border-[3px] border-ink px-3 py-3 shadow-[3px_3px_0_#171310] ${item.tone}`}
              >
                <p className="text-[0.78rem] font-bold text-ink/75">
                  {item.label}
                </p>
                <p className="mt-2 font-display text-[1.8rem] leading-none text-ink">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <section className="rounded-[18px] border-[3px] border-ink bg-paper p-4 shadow-[5px_5px_0_#171310]">
            <h3 className="font-display text-[1.5rem] leading-none text-ink">
              Active draws
            </h3>
            {activeDraws.length === 0 ? (
              <p className="mt-3 rounded-[12px] border-[3px] border-ink bg-pink-tint p-3 text-sm text-ink/60">
                No draws available.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-[3px] border-ink text-xs font-bold text-ink/70">
                      <th className="px-2 py-2 font-bold">Draw</th>
                      <th className="px-2 py-2 font-bold">Status</th>
                      <th className="px-2 py-2 font-bold">Sold</th>
                      <th className="px-2 py-2 font-bold">Prize</th>
                      <th className="px-2 py-2 font-bold">Draw at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDraws.map((item, index) => (
                      <tr
                        key={item.id}
                        className={
                          index === activeDraws.length - 1
                            ? ""
                            : "border-b border-ink/20"
                        }
                      >
                        <td className="px-2 py-2.5">
                          <p className="font-semibold text-ink">{item.title}</p>
                          <p className="text-xs text-ink/55">{item.drawCode}</p>
                        </td>
                        <td className="px-2 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-ink/80">
                          {item.ticketsSold}/{item.maxTickets}
                        </td>
                        <td className="px-2 py-2.5 text-ink/80">
                          {formatCurrency(item.prizeAmount)}
                        </td>
                        <td className="px-2 py-2.5 text-ink/70">
                          {formatDateTime(item.drawAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-[18px] border-[3px] border-ink bg-pink-tint p-4 shadow-[5px_5px_0_#171310]">
              <h3 className="font-display text-[1.5rem] leading-none text-ink">
                Recent ticket purchases
              </h3>
              {recentTicketPurchases.length === 0 ? (
                <p className="mt-3 rounded-[12px] border-[3px] border-ink bg-paper p-3 text-sm text-ink/60">
                  No recent purchases.
                </p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {recentTicketPurchases.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[12px] border-[3px] border-ink bg-paper p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">
                          {item.userName}
                        </p>
                        <p className="text-xs text-ink/55">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-ink/75">
                        {item.drawTitle} · {item.ticketCode}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[18px] border-[3px] border-ink bg-yellow-tint p-4 shadow-[5px_5px_0_#171310]">
              <h3 className="font-display text-[1.5rem] leading-none text-ink">
                Recent winners
              </h3>
              {recentWinners.length === 0 ? (
                <p className="mt-3 rounded-[12px] border-[3px] border-ink bg-paper p-3 text-sm text-ink/60">
                  No winners announced yet.
                </p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {recentWinners.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[12px] border-[3px] border-ink bg-paper p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">
                          {item.winnerName}
                        </p>
                        <p className="text-xs font-semibold text-red">
                          {formatCurrency(item.prizeAmount)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-ink/75">
                        {item.drawTitle}
                      </p>
                      <p className="mt-1 text-xs text-ink/55">
                        {formatDateTime(item.announcedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-[18px] border-[3px] border-ink bg-[#fff1f6] p-4 shadow-[5px_5px_0_#171310]">
            <h3 className="font-display text-[1.5rem] leading-none text-ink">
              Support queue
            </h3>
            {recentSupportRequests.length === 0 ? (
              <p className="mt-3 rounded-[12px] border-[3px] border-ink bg-paper p-3 text-sm text-ink/60">
                No support requests yet.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-[3px] border-ink text-xs font-bold text-ink/70">
                      <th className="px-2 py-2 font-bold">User</th>
                      <th className="px-2 py-2 font-bold">Issue</th>
                      <th className="px-2 py-2 font-bold">Subject</th>
                      <th className="px-2 py-2 font-bold">Status</th>
                      <th className="px-2 py-2 font-bold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSupportRequests.map((item, index) => (
                      <tr
                        key={item.id}
                        className={
                          index === recentSupportRequests.length - 1
                            ? ""
                            : "border-b border-ink/20"
                        }
                      >
                        <td className="px-2 py-2.5 text-ink">{item.userName}</td>
                        <td className="px-2 py-2.5 text-ink/75">
                          {item.issueType}
                        </td>
                        <td className="px-2 py-2.5 text-ink/75">
                          {item.subject}
                        </td>
                        <td className="px-2 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-ink/55">
                          {formatDateTime(item.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
