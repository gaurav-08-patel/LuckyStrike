import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "./ui/Toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type DrawRecord = {
  id: number;
  draw_code: string;
  draw_type: string;
  title: string;
  prize_title: string;
  prize_amount: number;
  ticket_price: number;
  max_tickets: number;
  tickets_sold: number;
  draw_at: string;
  expires_at: string;
  status: string;
};

const emptyForm = {
  title: "",
  prizeTitle: "",
  prizeAmount: "",
  ticketPrice: "",
  maxTickets: "",
  drawType: "daily",
  drawAt: "",
  expiresAt: "",
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

  if (["active", "scheduled"].includes(normalized)) {
    return "border-[3px] border-ink bg-yellow text-ink";
  }

  if (["completed", "resolved", "closed"].includes(normalized)) {
    return "border-[3px] border-ink bg-pink text-white";
  }

  if (["expired", "cancelled", "lost"].includes(normalized)) {
    return "border-[3px] border-ink bg-red text-white";
  }

  return "border-[3px] border-ink bg-paper text-ink";
}

function getFriendlyCreateError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("title") || normalized.includes("prize title")) {
    return "Please add a draw title and prize title before saving.";
  }

  if (normalized.includes("drawtype") || normalized.includes("draw type")) {
    return "Please choose a valid draw type.";
  }

  if (
    normalized.includes("drawat") ||
    normalized.includes("expiresat") ||
    normalized.includes("timestamp") ||
    normalized.includes("date")
  ) {
    return "Please enter valid draw and expiry timings.";
  }

  if (
    normalized.includes("prize amount") ||
    normalized.includes("ticket price") ||
    normalized.includes("max tickets")
  ) {
    return "Please check the prize amount, ticket price, and ticket limit.";
  }

  if (normalized.includes("unauthorized") || normalized.includes("admin only")) {
    return "Your session has expired. Please log in again and try once more.";
  }

  return "Something went wrong while creating the draw. Please review the form and try again.";
}

function getFriendlySettleError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("not found") || normalized.includes("invalid draw")) {
    return "This draw is no longer available for settlement.";
  }

  if (
    normalized.includes("already") ||
    normalized.includes("completed") ||
    normalized.includes("closed") ||
    normalized.includes("settled")
  ) {
    return "This draw is already settled or no longer active. No further action is needed. Please select an active draw only.";
  }

  if (normalized.includes("unauthorized") || normalized.includes("admin only")) {
    return "Your session expired before the settle action could finish.";
  }

  return "The draw could not be settled right now. Please try again in a moment.";
}

export default function DrawsTab() {
  const [draws, setDraws] = useState<DrawRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [creating, setCreating] = useState(false);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [drawToSettle, setDrawToSettle] = useState<DrawRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [totalDraws, setTotalDraws] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isInitialSearchEffect = useRef(true);

  const loadDraws = async (append = false, customSearch = searchTerm) => {
    const token = localStorage.getItem("luckyStrikeToken");

    if (!token) {
      setErrorMessage("Your session has expired. Please sign in again.");
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage("");

      const params = new URLSearchParams({
        limit: "15",
        offset: String(append ? draws.length : 0),
        search: customSearch.trim(),
        status: "all",
        drawType: "all",
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/draws?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load draws.");
      }

      const nextDraws = Array.isArray(data?.draws) ? data.draws : [];
      setDraws((previous) => (append ? [...previous, ...nextDraws] : nextDraws));
      setHasMore(Boolean(data?.hasMore));
      setTotalDraws(Number(data?.total ?? nextDraws.length));
    } catch {
      setDraws([]);
      setHasMore(false);
      setTotalDraws(0);
      setErrorMessage("Unable to load draw details right now. Please refresh and try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadDraws(false, "");
  }, []);

  useEffect(() => {
    if (isInitialSearchEffect.current) {
      isInitialSearchEffect.current = false;
      return;
    }

    const trimmedSearch = searchTerm.trim();

    const timeoutId = window.setTimeout(() => {
      void loadDraws(false, trimmedSearch);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleFieldChange = (
    field: keyof typeof emptyForm,
  ) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleCreateDraw = async (event: FormEvent) => {
    event.preventDefault();

    const token = localStorage.getItem("luckyStrikeToken");

    if (!token) {
      setErrorMessage("Your session has expired. Please sign in again.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      prizeTitle: form.prizeTitle.trim(),
      prizeAmount: Number(form.prizeAmount),
      ticketPrice: Number(form.ticketPrice),
      maxTickets: Number(form.maxTickets),
      drawType: form.drawType,
      drawAt: form.drawAt ? new Date(form.drawAt).toISOString() : "",
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : "",
    };

    if (!payload.title || !payload.prizeTitle) {
      setErrorMessage("Please add a draw title and prize title before saving.");
      return;
    }

    if (!payload.drawAt || !payload.expiresAt) {
      setErrorMessage("Please set valid draw and expiry timings.");
      return;
    }

    if (
      !Number.isFinite(payload.prizeAmount) ||
      payload.prizeAmount <= 0 ||
      !Number.isFinite(payload.ticketPrice) ||
      payload.ticketPrice <= 0 ||
      !Number.isInteger(payload.maxTickets) ||
      payload.maxTickets <= 0
    ) {
      setErrorMessage(
        "Please check the prize amount, ticket price, and ticket limit.",
      );
      return;
    }

    try {
      setCreating(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`${API_BASE_URL}/api/admin/draws`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to create draw.");
      }

      toast.success("Draw created", "The new draw is now available in the dashboard.");
      setSuccessMessage("Draw created successfully.");
      setForm(emptyForm);
      await loadDraws();
    } catch (error) {
      const fallback =
        error instanceof Error ? error.message : "Unable to create draw.";
      const friendlyMessage = getFriendlyCreateError(fallback);
      setErrorMessage(friendlyMessage);
      toast.error("Couldn’t create draw", friendlyMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleSettleDraw = async (drawId: number) => {
    const token = localStorage.getItem("luckyStrikeToken");

    if (!token) {
      const friendlyMessage = "Your session has expired. Please sign in again.";
      setErrorMessage(friendlyMessage);
      toast.error("Session expired", friendlyMessage);
      return;
    }

    try {
      setSettlingId(drawId);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`${API_BASE_URL}/api/admin/draws/${drawId}/settle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to settle draw.");
      }

      toast.success("Draw settled", "The selected draw was finalized successfully.");
      setSuccessMessage("Draw settled successfully.");
      setDrawToSettle(null);
      await loadDraws(false, searchTerm);
    } catch (error) {
      const fallback =
        error instanceof Error ? error.message : "Unable to settle draw.";
      const friendlyMessage = getFriendlySettleError(fallback);
      toast.error("Settle failed", friendlyMessage);
      setErrorMessage(friendlyMessage);
      setDrawToSettle(null);
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border-[3px] border-ink bg-[radial-gradient(circle_at_top_left,#fff5f7_0%,#fff9ef_35%,#fffdfb_100%)] p-4 shadow-[7px_7px_0_#171310] sm:p-6">
        <div className="flex flex-col gap-4 rounded-[22px] border-[3px] border-ink bg-[linear-gradient(135deg,#fff3f8_0%,#fff8de_100%)] p-4 shadow-[4px_4px_0_#171310] sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div className="max-w-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-pink">Admin tools</p>
            <h2 className="mt-2 font-display text-[2.1rem] leading-none tracking-[-0.06em] text-ink sm:text-[2.7rem]">
              Draws
            </h2>
            <p className="mt-2 text-sm text-ink/70 sm:text-[15px]">
              Create new raffles and settle active draws when the time is complete.
            </p>
          </div>
          <div className="rounded-full border-[3px] border-ink bg-[#fff] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-ink shadow-[2px_2px_0_#171310]">
            Live setup
          </div>
        </div>

        <form
          onSubmit={handleCreateDraw}
          className="mt-5 rounded-[24px] border-[3px] border-ink bg-[#fffefc] p-4 shadow-[7px_7px_0_#171310] sm:p-5"
        >
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-pink">Create new draw</p>
            <h3 className="mt-2 font-display text-[1.8rem] leading-none tracking-[-0.05em] text-ink">
              Draw details
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="group rounded-[18px] border-[3px] border-ink bg-[linear-gradient(180deg,#ffffff_0%,#fff9fb_100%)] p-3 text-sm font-bold text-ink shadow-[3px_3px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#171310] focus-within:-translate-y-0.5 focus-within:shadow-[4px_4px_0_#171310]">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-ink/70">
                Title
              </span>
              <input
                type="text"
                value={form.title}
                onChange={handleFieldChange("title")}
                className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink placeholder:text-ink/40 focus:outline-none"
                placeholder="Weekend Gold Rush"
              />
            </label>

            <label className="group rounded-[18px] border-[3px] border-ink bg-[linear-gradient(180deg,#ffffff_0%,#fffaf3_100%)] p-3 text-sm font-bold text-ink shadow-[3px_3px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#171310] focus-within:-translate-y-0.5 focus-within:shadow-[4px_4px_0_#171310]">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-ink/70">
                Prize title
              </span>
              <input
                type="text"
                value={form.prizeTitle}
                onChange={handleFieldChange("prizeTitle")}
                className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink placeholder:text-ink/40 focus:outline-none"
                placeholder="Cash Prize"
              />
            </label>

            <label className="group rounded-[18px] border-[3px] border-ink bg-[linear-gradient(180deg,#ffffff_0%,#fff6ee_100%)] p-3 text-sm font-bold text-ink shadow-[3px_3px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#171310] focus-within:-translate-y-0.5 focus-within:shadow-[4px_4px_0_#171310]">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-ink/70">
                Prize amount
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.prizeAmount}
                onChange={handleFieldChange("prizeAmount")}
                className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink placeholder:text-ink/40 focus:outline-none"
                placeholder="50000"
              />
            </label>

            <label className="group rounded-[18px] border-[3px] border-ink bg-[linear-gradient(180deg,#ffffff_0%,#fffaf5_100%)] p-3 text-sm font-bold text-ink shadow-[3px_3px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#171310] focus-within:-translate-y-0.5 focus-within:shadow-[4px_4px_0_#171310]">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-ink/70">
                Ticket price
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.ticketPrice}
                onChange={handleFieldChange("ticketPrice")}
                className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink placeholder:text-ink/40 focus:outline-none"
                placeholder="100"
              />
            </label>

            <label className="group rounded-[18px] border-[3px] border-ink bg-[linear-gradient(180deg,#ffffff_0%,#fffdf9_100%)] p-3 text-sm font-bold text-ink shadow-[3px_3px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#171310] focus-within:-translate-y-0.5 focus-within:shadow-[4px_4px_0_#171310]">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-ink/70">
                Max tickets
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.maxTickets}
                onChange={handleFieldChange("maxTickets")}
                className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink placeholder:text-ink/40 focus:outline-none"
                placeholder="500"
              />
            </label>

            <label className="group rounded-[18px] border-[3px] border-ink bg-[linear-gradient(180deg,#ffffff_0%,#fff7f1_100%)] p-3 text-sm font-bold text-ink shadow-[3px_3px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#171310] focus-within:-translate-y-0.5 focus-within:shadow-[4px_4px_0_#171310]">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-ink/70">
                Draw type
              </span>
              <select
                value={form.drawType}
                onChange={handleFieldChange("drawType")}
                className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <label className="group rounded-[18px] border-[3px] border-ink bg-[linear-gradient(180deg,#ffffff_0%,#fffaf2_100%)] p-3 text-sm font-bold text-ink shadow-[3px_3px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#171310] focus-within:-translate-y-0.5 focus-within:shadow-[4px_4px_0_#171310]">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-ink/70">
                Draw at
              </span>
              <input
                type="datetime-local"
                value={form.drawAt}
                onChange={handleFieldChange("drawAt")}
                className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink focus:outline-none"
              />
            </label>

            <label className="group rounded-[18px] border-[3px] border-ink bg-[linear-gradient(180deg,#ffffff_0%,#fff8f8_100%)] p-3 text-sm font-bold text-ink shadow-[3px_3px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#171310] focus-within:-translate-y-0.5 focus-within:shadow-[4px_4px_0_#171310]">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-ink/70">
                Expires at
              </span>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={handleFieldChange("expiresAt")}
                className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={creating}
              className="cursor-pointer rounded-full border-[3px] border-ink bg-gradient-to-r from-[#ff5c8a] via-[#ff3d8c] to-[#ff6d52] px-5 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[4px_4px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#171310] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create draw"}
            </button>
          </div>
        </form>

        {errorMessage ? (
          <div className="mt-4 rounded-[14px] border-[3px] border-ink bg-[#ffe8e8] p-3 text-sm text-[#9a2f2f] shadow-[3px_3px_0_#171310]">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-4 rounded-[14px] border-[3px] border-ink bg-[#eafde8] p-3 text-sm text-[#1d5d36] shadow-[3px_3px_0_#171310]">
            {successMessage}
          </div>
        ) : null}
      </div>

      <section className="rounded-[24px] border-[3px] border-ink bg-paper p-5 shadow-[6px_6px_0_#171310]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-[1.6rem] leading-none text-ink">
            All draws
          </h3>
          <span className="rounded-full border-[3px] border-ink bg-yellow px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-ink">
            {draws.length} shown / {totalDraws} total
          </span>
        </div>

        <div className="mb-4">
          <label className="block rounded-[18px] border-[3px] border-pink bg-[#fff7fa] p-3 shadow-[3px_3px_0_#171310]">
            <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-pink">
              <span className="text-base">⌕</span>
              Search draws
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by draw name, code, or ID"
              className="w-full border-0 bg-transparent p-0 text-sm font-medium text-ink placeholder:text-ink/40 focus:outline-none"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="rounded-[14px] border-[3px] border-ink bg-warm p-4 text-sm text-ink/60">
            Loading draws...
          </div>
        ) : draws.length === 0 ? (
          <div className="rounded-[14px] border-[3px] border-ink bg-[#fff1f6] p-4 text-sm text-ink/60">
            {searchTerm.trim() ? "No draws match your search." : "No draws found."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b-[3px] border-ink text-xs font-bold uppercase tracking-[0.08em] text-ink/70">
                    <th className="px-2 py-2">Code</th>
                    <th className="px-2 py-2">Title</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Prize</th>
                    <th className="px-2 py-2">Price</th>
                    <th className="px-2 py-2">Sold</th>
                    <th className="px-2 py-2">Draw time</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {draws.map((draw, index) => (
                    <tr
                      key={draw.id}
                      className={
                        index === draws.length - 1 ? "" : "border-b border-ink/20"
                      }
                    >
                      <td className="px-2 py-2.5 font-bold text-ink">{draw.draw_code}</td>
                      <td className="px-2 py-2.5 text-ink">
                        <p className="font-semibold">{draw.title}</p>
                        <p className="text-[11px] text-ink/60">{draw.prize_title}</p>
                      </td>
                      <td className="px-2 py-2.5 uppercase text-ink/75">
                        {draw.draw_type}
                      </td>
                      <td className="px-2 py-2.5 text-ink/80">
                        {formatCurrency(Number(draw.prize_amount || 0))}
                      </td>
                      <td className="px-2 py-2.5 text-ink/80">
                        {formatCurrency(Number(draw.ticket_price || 0))}
                      </td>
                      <td className="px-2 py-2.5 text-ink/80">
                        {draw.tickets_sold}/{draw.max_tickets}
                      </td>
                      <td className="px-2 py-2.5 text-ink/70">
                        {formatDateTime(draw.draw_at)}
                      </td>
                      <td className="px-2 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(draw.status)}`}
                        >
                          {draw.status}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <button
                          type="button"
                          disabled={draw.status !== "active" || settlingId === draw.id}
                          onClick={() => setDrawToSettle(draw)}
                          className="cursor-pointer rounded-full border-[3px] border-ink bg-yellow px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-ink shadow-[2px_2px_0_#171310] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {settlingId === draw.id ? "Settling..." : "Settle"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadDraws(true, searchTerm)}
                  disabled={isLoadingMore}
                  className="cursor-pointer rounded-full border-[3px] border-ink bg-pink px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_#171310] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingMore ? "Loading more..." : "Show more"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {drawToSettle && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          onClick={() => setDrawToSettle(null)}
        >
          <div
            className="w-[92%] max-w-md rounded-xl bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.25)] transform transition-all duration-300 ease-out opacity-100 translate-y-0 scale-100"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-black text-ink">Confirm draw settlement</h3>
            <p className="mb-5 text-sm text-ink/80">
              Are you sure you want to settle <span className="font-bold">{drawToSettle.title}</span>? This action finalizes the draw and cannot be undone accidentally.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDrawToSettle(null)}
                className="cursor-pointer rounded-md px-3 py-2 text-sm font-bold text-ink/80"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleSettleDraw(drawToSettle.id);
                }}
                className="cursor-pointer rounded-md bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-4 py-2 text-sm font-black text-white"
              >
                Settle draw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
