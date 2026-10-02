import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type TicketStatusFilter = "all" | "active" | "won" | "lost";

type MyTicketApiItem = {
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
    ticketPrice: number;
    drawAt: string;
    expiresAt: string;
    drawStatus: string;
  };
};

type MyTicketApiResponse = {
  tickets: MyTicketApiItem[];
  total: number;
  filter?: string;
  summary?: {
    all: number;
    active: number;
    won: number;
    lost: number;
  };
};

type DrawGroup = {
  drawId: number;
  drawCode: string;
  title: string;
  prizeTitle: string;
  prizeAmount: number;
  drawStatus: string;
  drawAt: string;
  expiresAt: string;
  tickets: MyTicketApiItem[];
};

const filterOptions: { key: TicketStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrize(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDrawStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "completed" || normalized === "finished") {
    return "bg-[#dff9e8] text-[#126c44] border-[#1e8d5e] shadow-[2px_2px_0_#1e8d5e]";
  }

  if (normalized === "closed" || normalized === "expired") {
    return "bg-[#eceae7] text-[#4d4b49] border-[#7a7571] shadow-[2px_2px_0_#7a7571]";
  }

  if (normalized === "active" || normalized === "live") {
    return "bg-[#fff1b8] text-[#7d5600] border-[#dca400] shadow-[2px_2px_0_#dca400]";
  }

  return "bg-[#fde7ef] text-[#8d1d59] border-[#d94b8a] shadow-[2px_2px_0_#d94b8a]";
}

function getTicketStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "won") {
    return "bg-[#dff7e7] text-[#16714a] border-[#1e8d5e] shadow-[2px_2px_0_#1e8d5e]";
  }

  if (normalized === "lost") {
    return "bg-[#ffe2e2] text-[#a92525] border-[#d14343] shadow-[2px_2px_0_#d14343]";
  }

  if (normalized === "active" || normalized === "pending") {
    return "bg-[#fff1b8] text-[#7d5600] border-[#dca400] shadow-[2px_2px_0_#dca400]";
  }

  return "bg-[#eceae7] text-[#4d4b49] border-[#7a7571] shadow-[2px_2px_0_#7a7571]";
}

function getTicketCardTheme(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "won") {
    return "bg-[linear-gradient(135deg,#f3fff7_0%,#dcfce7_40%,#f8fff9_100%)]";
  }

  if (normalized === "lost") {
    return "bg-[linear-gradient(135deg,#fff5f5_0%,#ffe3e3_40%,#fffdf7_100%)]";
  }

  return "bg-[linear-gradient(135deg,#fffef7_0%,#fff1b8_38%,#fffdf0_100%)]";
}

function MyTicketsPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] =
    useState<TicketStatusFilter>("all");
  const [tickets, setTickets] = useState<MyTicketApiItem[]>([]);
  const [summary, setSummary] = useState({
    all: 0,
    active: 0,
    won: 0,
    lost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setTickets([]);
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      const token = localStorage.getItem("luckyStrikeToken");

      if (!token) {
        setTickets([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const query =
          selectedStatus === "all" ? "" : `?status=${selectedStatus}`;
        const response = await fetch(`${API_BASE_URL}/api/my-tickets${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load tickets.");
        }

        const data = (await response.json()) as MyTicketApiResponse;
        setTickets(Array.isArray(data.tickets) ? data.tickets : []);
        setSummary(
          data.summary || {
            all: 0,
            active: 0,
            won: 0,
            lost: 0,
          },
        );
      } catch (error) {
        console.warn("Tickets failed to load:", error);
        setTickets([]);
        setSummary({ all: 0, active: 0, won: 0, lost: 0 });
      } finally {
        setLoading(false);
      }
    };

    void fetchTickets();
  }, [isLoggedIn, selectedStatus]);

  const groupedTickets = useMemo<DrawGroup[]>(() => {
    const groups = new Map<number, DrawGroup>();

    tickets.forEach((ticket) => {
      const draw = ticket.draw;
      const existing = groups.get(draw.id);

      if (existing) {
        existing.tickets.push(ticket);
        return;
      }

      groups.set(draw.id, {
        drawId: draw.id,
        drawCode: draw.drawCode,
        title: draw.title,
        prizeTitle: draw.prizeTitle,
        prizeAmount: draw.prizeAmount,
        drawStatus: draw.drawStatus,
        drawAt: draw.drawAt,
        expiresAt: draw.expiresAt,
        tickets: [ticket],
      });
    });

    return Array.from(groups.values()).sort((a, b) => {
      return new Date(b.drawAt).getTime() - new Date(a.drawAt).getTime();
    });
  }, [tickets]);

  const counts = useMemo(() => {
    return {
      all: summary.all,
      active: summary.active,
      won: summary.won,
      lost: summary.lost,
    };
  }, [summary]);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4f1_0%,#fffaf7_100%)] text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
      />

      <section className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 rounded-[28px] border-[3px] border-ink bg-[#fff4d6] p-4 shadow-[6px_6px_0_#171310] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-[0.14em] text-ink/60">
                Account
              </p>
              <h1 className="font-display text-4xl uppercase tracking-[-0.05em] text-ink sm:text-5xl">
                My tickets
              </h1>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-[#ff3d8c] px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.12em] text-white shadow-[4px_4px_0_#171310] transition-transform hover:-translate-y-0.5"
            >
              Browse draws
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const isActive = option.key === selectedStatus;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedStatus(option.key)}
                className={`rounded-full border-[3px] px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] transition-all ${
                  isActive
                    ? "border-ink bg-[#ff4d8d] text-white shadow-[3px_3px_0_#171310]"
                    : "border-ink bg-white text-ink shadow-[2px_2px_0_#f6d6a8]"
                }`}
              >
                {option.label} ({counts[option.key]})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="rounded-[22px] border-[3px] border-ink bg-[linear-gradient(135deg,#fffef8_0%,#fff5bd_100%)] p-8 text-center font-black uppercase tracking-[0.12em] text-ink/60 shadow-[5px_5px_0_#171310]">
            Loading your tickets...
          </div>
        ) : groupedTickets.length === 0 ? (
          <div className="rounded-[22px] border-[3px] border-ink bg-[linear-gradient(135deg,#fff8fb_0%,#ffe2f1_100%)] p-8 text-center shadow-[5px_5px_0_#171310]">
            <p className="font-display text-2xl uppercase tracking-[-0.04em] text-ink">
              No tickets found
            </p>
            <p className="mt-3 text-sm text-ink/70">
              Try another filter or buy tickets from an active draw.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedTickets.map((group) => (
              <div
                key={group.drawId}
                className="rounded-[24px] border-[2px] border-ink/70 bg-[linear-gradient(135deg,#fffaf1_0%,#fff1b8_30%,#ffe1ef_100%)] p-4 shadow-[5px_5px_0_#171310] sm:p-5"
              >
                <div className="mb-4 flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-ink/60">
                      Draw: {group.drawCode}
                    </p>
                    <h2 className="mt-1 font-display text-[1.6rem] uppercase tracking-[-0.05em] text-ink sm:text-[2.1rem]">
                      {group.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border-[2px] px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] ${getDrawStatusClasses(
                        group.drawStatus,
                      )}`}
                    >
                      {group.drawStatus}
                    </span>
                    <span className="rounded-full border-[2px] border-ink bg-white px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink">
                      {group.tickets.length} ticket
                      {group.tickets.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="mb-4 grid gap-2 text-sm text-ink/80 sm:grid-cols-3">
                  <div className="rounded-[12px] border-[1px] border-ink/30 bg-white/80 p-2.5">
                    <div className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink/60">
                      Prize
                    </div>
                    <div className="mt-1 font-bold text-ink">
                      {group.prizeTitle} · {formatPrize(group.prizeAmount)}
                    </div>
                  </div>

                  <div className="rounded-[12px] border-[1px] border-ink/30 bg-white/80 p-2.5">
                    <div className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink/60">
                      Draw time
                    </div>
                    <div className="mt-1 font-bold text-ink">
                      {formatDate(group.drawAt)}
                    </div>
                  </div>

                  <div className="rounded-[12px] border-[1px] border-ink/30 bg-white/80 p-2.5">
                    <div className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink/60">
                      Closes
                    </div>
                    <div className="mt-1 font-bold text-ink">
                      {formatDate(group.expiresAt)}
                    </div>
                  </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto rounded-[18px] border-[2px] border-ink/30 bg-[#f9f7f5] p-2 sm:p-3">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {group.tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`relative overflow-hidden rounded-[18px] border-[2px] border-ink/70 p-3 shadow-[3px_3px_0_#171310] before:absolute before:left-[-8px] before:top-1/2 before:h-5 before:w-5 before:-translate-y-1/2 before:rounded-full before:border-[2px] before:border-ink before:bg-[#f9f7f5] after:absolute after:right-[-8px] after:top-1/2 after:h-5 after:w-5 after:-translate-y-1/2 after:rounded-full after:border-[2px] after:border-ink after:bg-[#f9f7f5] ${getTicketCardTheme(
                          ticket.ticketStatus,
                        )}`}
                      >
                        <div className="pointer-events-none absolute inset-x-3 top-1/2 h-0 -translate-y-1/2 border-t-[2px] border-dashed border-ink/30" />
                        <div className="relative z-10 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink/60">
                              Ticket
                            </p>
                            <p className="mt-1 font-display text-xl uppercase tracking-[-0.04em] text-ink">
                              {ticket.ticketCode}
                            </p>
                          </div>

                          <span
                            className={`inline-flex items-center rounded-full border-[2px] px-2 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] ${getTicketStatusClasses(
                              ticket.ticketStatus,
                            )}`}
                          >
                            {ticket.ticketStatus}
                          </span>
                        </div>

                        <div className="relative z-10 mt-3 space-y-1 border-t-[2px] border-dashed border-ink/20 pt-2 text-[0.72rem] text-ink/75">
                          <p>Price: {ticket.draw.ticketPrice}</p>
                          <p>Purchased: {formatDate(ticket.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

export default MyTicketsPage;
