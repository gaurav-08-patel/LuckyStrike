import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "../components/ui/Toast";
import Footer from "../components/Footer";
import MetaData from "../components/MetaData";
import SiteHeader from "../components/SiteHeader";
import { useAuth } from "../context/AuthContext";
import { normalizeCampaignData, type Campaign } from "../data/campaignsData";
import {
  formatCountdown,
  formatDrawDateTime,
  formatPrize,
  getCampaignDeadline,
} from "./Home";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function CampaignPage() {
  const { id } = useParams();
  const { user, setUser, isLoggedIn } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(true);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketStage, setTicketStage] = useState<"quantity" | "confirm">(
    "quantity",
  );
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [buyingTickets, setBuyingTickets] = useState(false);
  const [ticketError, setTicketError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!id) {
      setCampaign(null);
      setLoading(false);
      return;
    }

    const loadCampaign = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/draws/${encodeURIComponent(id)}`,
        );

        if (!response.ok) {
          throw new Error("Draw not found");
        }

        const data = (await response.json()) as Record<string, unknown>;
        setCampaign(normalizeCampaignData(data));
      } catch (error) {
        console.warn("Draw failed to load:", error);
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    };

    void loadCampaign();
  }, [id]);

  if (loading) {
    return (
      <>
        <MetaData
          title="Loading campaign"
          description="Loading the latest Lucky Strike campaign details."
          canonical={id ? `/${id}` : "/"}
        />
        <main className="min-h-screen bg-[#f3f0ee] text-ink">
          <SiteHeader
            brand={
              <>
                Lucky<span className="text-red">Strike</span>
              </>
            }
          />
          <section className="mx-auto max-w-[1200px] px-4 py-16 text-center text-lg font-bold uppercase tracking-[0.12em] text-ink/70">
            Loading draw...
          </section>
          <Footer />
        </main>
      </>
    );
  }

  if (!campaign) {
    return <Navigate to="/" replace />;
  }

  const deadline = getCampaignDeadline(campaign);
  const remainingMs = deadline.getTime() - now.getTime();
  const isExpired = remainingMs <= 0;
  const dayMs = 24 * 60 * 60 * 1000;
  const showCountdown = !isExpired && remainingMs <= 2 * dayMs;
  const isJustLaunched =
    !isExpired && remainingMs > 2 * dayMs && remainingMs <= 7 * dayMs;
  const productTone = isExpired
    ? "bg-ink text-paper"
    : showCountdown
      ? "bg-red text-white"
      : "bg-[#3ACF7E] text-[#0d2a20]";
  const walletBalance = Number(user?.walletBalance ?? 0);
  const pendingWithdrawalAmount = Number(user?.pendingWithdrawalAmount ?? 0);
  const availableBalance = Math.max(walletBalance - pendingWithdrawalAmount, 0);
  const totalTicketCost = ticketQuantity * Number(campaign.entryFrom || 0);
  const displayedWalletBalance = isLoggedIn ? availableBalance : 0;
  const totalTicketsAvailable = Number(
    campaign.soldTotal ?? campaign.max_tickets ?? 0,
  );
  const soldTicketsCount = Number(campaign.soldCount ?? 0);

  const campaignCanonical = id ? `/${id}` : "/";

  const resetTicketModal = () => {
    setTicketModalOpen(false);
    setTicketStage("quantity");
    setTicketQuantity(1);
    setTicketError("");
  };

  const openTicketModal = () => {
    if (!isLoggedIn) {
      toast.error("Login required", "Please sign in before buying tickets.");
      return;
    }

    setTicketError("");
    setTicketStage("quantity");
    setTicketQuantity(1);
    setTicketModalOpen(true);
  };

  const handleQuantityNext = () => {
    if (!Number.isInteger(ticketQuantity) || ticketQuantity <= 0) {
      setTicketError("Please choose at least 1 ticket.");
      return;
    }

    if (availableBalance < totalTicketCost) {
      setTicketError(
        `You need ${campaign.currency} ${totalTicketCost.toLocaleString("en-AE")} available to spend to continue.`,
      );
      return;
    }

    setTicketError("");
    setTicketStage("confirm");
  };

  const handleBuyTickets = async () => {
    if (!campaign || !id || !isLoggedIn) {
      toast.error("Purchase failed", "Please sign in and try again.");
      return;
    }

    const token = localStorage.getItem("luckyStrikeToken");

    if (!token) {
      toast.error("Purchase failed", "Your session is no longer active.");
      return;
    }

    try {
      setBuyingTickets(true);
      setTicketError("");

      const response = await fetch(
        `${API_BASE_URL}/api/draws/${encodeURIComponent(String(campaign.id))}/buy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity: ticketQuantity }),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "Ticket purchase failed.");
      }

      const updatedWalletBalance = Math.max(
        0,
        Number(user?.walletBalance ?? 0) - totalTicketCost,
      );

      setUser(
        {
          ...(user ?? {}),
          walletBalance: updatedWalletBalance,
        },
        token,
      );

      const refreshedResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (refreshedResponse.ok) {
        const refreshedData = (await refreshedResponse.json()) as {
          user?: { walletBalance?: number; [key: string]: unknown };
        };

        if (refreshedData.user) {
          setUser(refreshedData.user as typeof user, token);
        }
      }

      toast.success(
        "Tickets bought",
        `You bought ${ticketQuantity} ticket${ticketQuantity > 1 ? "s" : ""} successfully.`,
      );
      resetTicketModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setTicketError(message);
      toast.error("Purchase failed", message);
    } finally {
      setBuyingTickets(false);
    }
  };

  return (
    <>
      <MetaData
        title={campaign.title}
        description={`Join the ${campaign.title} Lucky Strike draw and discover ${campaign.currency} ${Number(campaign.entryFrom || 0).toLocaleString("en-AE")} entry opportunities.`}
        image={campaign.image}
        canonical={campaignCanonical}
        type="article"
      />
      <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf6_0%,#f7efe9_28%,#f3ebe7_100%)] text-ink">
        <style>{`
          .campaign-page-shell {
            position: relative;
          }
          .campaign-page-shell::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at top right, rgba(255, 87, 135, 0.14), transparent 30%),
              linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
            pointer-events: none;
          }
          .campaign-hero-card {
            background: linear-gradient(135deg, #fffdfb 0%, #fff7f2 35%, #fff0f6 100%);
          }
          .campaign-spotlight {
            background: linear-gradient(135deg, #fff6d8 0%, #ffe7ef 100%);
          }
          .campaign-stat-card {
            background: linear-gradient(180deg, #ffffff 0%, #fff7fa 100%);
          }
          .campaign-modal-card {
            background: linear-gradient(135deg, #fffdfb 0%, #fff6ef 52%, #fff0f7 100%);
          }
          .campaign-number-btn {
            background: linear-gradient(180deg, #ffe36b 0%, #f8d95b 100%);
          }
          .campaign-action-btn {
            background: linear-gradient(180deg, #4b5bdc 0%, #3549c9 100%);
          }
          .campaign-ghost-btn {
            background: linear-gradient(180deg, #ffffff 0%, #f8f3ef 100%);
          }
          .campaign-stage-badge {
            background: linear-gradient(135deg, #fff3cc 0%, #ffe6ef 100%);
          }
        `}</style>

        <SiteHeader
          brand={
            <>
              Lucky<span className="text-red">Strike</span>
            </>
          }
        />

        <section className="campaign-page-shell relative mx-auto max-w-[1200px] px-3 py-6 sm:px-6 lg:px-8 lg:py-12">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/70 sm:mb-6 sm:text-sm">
            <Link to="/" className="transition-colors hover:text-red">
              Home
            </Link>
            <span>/</span>
            <span className="break-all">DRAW CODE: {campaign.draw_code || campaign.id}</span>
          </div>

          <div className="campaign-hero-card relative overflow-hidden rounded-[30px] border-[3px] border-ink shadow-[8px_8px_0_#171310]">
            <div className="campaign-spotlight absolute inset-x-0 top-0 h-24" />

            <div className="relative grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full border-[3px] border-ink bg-white px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-ink shadow-[2px_2px_0_#171310] sm:text-[0.68rem]">
                    Draw spotlight
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border-[3px] border-ink px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] shadow-[2px_2px_0_#171310] sm:text-[0.68rem] ${productTone}`}
                  >
                    {isExpired
                      ? "Closed"
                      : showCountdown
                        ? formatCountdown(deadline, now)
                        : isJustLaunched
                          ? "Live now"
                          : "Open"}
                  </span>
                </div>

                <div className="relative overflow-hidden rounded-[26px] border-[3px] border-ink bg-[#f8f0e8] p-2 shadow-[5px_5px_0_#171310] sm:rounded-[30px] sm:p-3">
                  <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                    {campaign.entriesMultiplier ? (
                      <span className="border-[3px] border-ink bg-yellow px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink shadow-[2px_2px_0_#171310]">
                        {campaign.entriesMultiplier}
                      </span>
                    ) : null}
                  </div>

                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="h-[260px] w-full rounded-[18px] border-[3px] border-ink object-cover sm:h-[420px] sm:rounded-[24px] lg:h-[500px]"
                  />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="campaign-stat-card rounded-[14px] border-[3px] border-ink p-2.5 shadow-[2px_2px_0_#171310]">
                    <p className="text-[0.55rem] font-black uppercase tracking-[0.11em] text-ink/60">Price</p>
                    <p className="mt-2 font-display text-xl uppercase tracking-[-0.04em] text-ink">
                      {campaign.currency} {Number(campaign.entryFrom || 0).toLocaleString("en-AE")}
                    </p>
                  </div>
                  <div className="campaign-stat-card rounded-[14px] border-[3px] border-ink p-2.5 shadow-[2px_2px_0_#171310]">
                    <p className="text-[0.55rem] font-black uppercase tracking-[0.11em] text-ink/60">Type</p>
                    <p className="mt-2 font-display text-xl uppercase tracking-[-0.04em] text-ink">
                      {campaign.prizeType}
                    </p>
                  </div>
                  <div className="campaign-stat-card rounded-[14px] border-[3px] border-ink p-2.5 shadow-[2px_2px_0_#171310]">
                    <p className="text-[0.55rem] font-black uppercase tracking-[0.11em] text-ink/60">Draw</p>
                    <p className="mt-2 font-display text-xl uppercase tracking-[-0.04em] text-ink">
                      {campaign.campaignType}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:p-7">
                <div className="campaign-stage-badge inline-flex rounded-full border-[3px] border-ink px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink shadow-[2px_2px_0_#171310]">
                  Lucky Strike draw
                </div>

                <h1 className="mt-4 font-display text-[2.2rem] uppercase leading-[0.9] tracking-[-0.06em] text-ink sm:text-[2.8rem] lg:text-[3.5rem]">
                  {formatPrize(campaign)}
                </h1>

                <p className="mt-3 text-sm font-medium text-ink/70 sm:text-base">
                  Enter now and stand a chance to win a {campaign.prizeType.toLowerCase()} reward with a live draw that closes soon.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="campaign-stat-card rounded-[18px] border-[3px] border-ink p-3 shadow-[3px_3px_0_#171310]">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink/60">Time left</p>
                    <p className="mt-2 font-display text-[1.5rem] uppercase leading-none tracking-[-0.05em] text-ink sm:text-[1.8rem]">
                      {isExpired ? "Closed" : formatCountdown(deadline, now)}
                    </p>
                  </div>

                  <div className="campaign-stat-card rounded-[18px] border-[3px] border-ink p-3 shadow-[3px_3px_0_#171310]">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink/60">Available</p>
                    <p className="mt-2 font-display text-[1.3rem] uppercase leading-none tracking-[-0.05em] text-ink sm:text-[1.6rem]">
                      {isLoggedIn
                        ? `${campaign.currency} ${displayedWalletBalance.toLocaleString("en-AE")}`
                        : "Login"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[18px] border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_#171310]">
                  <div className="flex items-center justify-between gap-3 text-[0.7rem] font-black uppercase tracking-[0.12em] text-ink/70 sm:text-[0.8rem]">
                    <span>Draw date</span>
                    <span>{formatDrawDateTime(campaign.drawDate)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[0.7rem] font-black uppercase tracking-[0.12em] text-ink/70 sm:text-[0.8rem]">
                    <span>Sold</span>
                    <span>{soldTicketsCount} / {totalTicketsAvailable}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[0.7rem] font-black uppercase tracking-[0.12em] text-ink/70 sm:text-[0.8rem]">
                    <span>Code</span>
                    <span className="break-all">{campaign.draw_code || campaign.id}</span>
                  </div>
                </div>

                <div className="mt-5">
                  <style>{`
                    .glow-entry-button{ 
                      background: linear-gradient(90deg,#ff7bb3 0%,#ff3d8c 52%,#ff5e6d 100%);
                      box-shadow: 0 20px 42px rgba(255,61,140,0.18), inset 0 0 0 1px rgba(255,255,255,0.18);
                      border-color: rgba(23,17,16,1);
                    }
                    .glow-entry-button:hover{ 
                      transform: translateY(-3px);
                      box-shadow: 0 24px 50px rgba(255,61,140,0.25), inset 0 0 0 1px rgba(255,255,255,0.22);
                    }
                    .glow-entry-button:active{ transform: translateY(-1px); }
                    .glow-entry-button .shine{ 
                      position:absolute; top:0; left:-60%; width:60%; height:100%;
                      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%);
                      transform: skewX(-20deg);
                      animation: shineMove 2.2s linear infinite;
                      pointer-events:none;
                      mix-blend-mode: overlay;
                    }
                    @keyframes shineMove{ from { left:-60%; } to { left:140%; } }
                  `}</style>

                  <button
                    type="button"
                    disabled={isExpired}
                    onClick={openTicketModal}
                    className={`campaign-cta relative overflow-hidden flex w-full items-center justify-center rounded-[18px] border-[3px] border-ink px-3 py-3 font-display text-[1rem] uppercase tracking-[0.06em] transition-all duration-200 sm:rounded-[22px] sm:px-5 sm:py-4 sm:text-[1.5rem] ${
                      isExpired
                        ? "cursor-not-allowed bg-[#d9d7d6] text-ink/50 opacity-80"
                        : "glow-entry-button text-white"
                    }`}
                  >
                    {isExpired ? "Closed" : `Buy ticket • ${campaign.currency} ${campaign.entryFrom}`}
                    {!isExpired && <span className="shine" aria-hidden="true" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border-[3px] border-ink bg-[linear-gradient(135deg,#fffdf8_0%,#fff0f3_100%)] p-4 shadow-[4px_4px_0_#171310] sm:mt-8 sm:rounded-[28px] sm:p-6 sm:shadow-[5px_5px_0_#171310]">
            <p className="text-base leading-relaxed text-ink sm:text-lg">
              Dream Big! The possibilities are endless. Whether you&apos;re dreaming of a holiday, making a statement purchase or starting a savings account, winning cash can go a long way towards making your dreams a reality. Participate now!
            </p>
          </div>
        </section>

        {ticketModalOpen ? (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#171310]/65 p-4 backdrop-blur-[2px]">
            <div className="campaign-modal-card w-full max-w-md rounded-[26px] border-[3px] border-ink p-4 shadow-[8px_8px_0_#171310] sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[1.4rem] uppercase leading-none text-ink sm:text-[1.7rem]">
                    {ticketStage === "quantity"
                      ? "Select quantity"
                      : "Confirm purchase"}
                  </p>
                  <p className="mt-2 text-sm font-medium text-ink/70">
                    {ticketStage === "quantity"
                      ? "Choose how many tickets you want to buy."
                      : "Review your wallet payment before confirming."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetTicketModal}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink bg-[#f7f7f7] text-xl font-black text-ink"
                  aria-label="Close ticket modal"
                >
                  ×
                </button>
              </div>

              {ticketStage === "quantity" ? (
                <div className="space-y-4">
                  <div className="rounded-[16px] border-[3px] border-ink bg-[#f7f7f7] p-4">
                    <div className="mb-2 flex items-center justify-between text-[0.7rem] font-black uppercase tracking-[0.1em] text-ink/70">
                      <span>Ticket price</span>
                      <span>
                        {campaign.currency}{" "}
                        {Number(campaign.entryFrom || 0).toLocaleString(
                          "en-AE",
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-[14px] border-[3px] border-ink bg-white p-3">
                      <button
                        type="button"
                        onClick={() =>
                          setTicketQuantity((current) =>
                            Math.max(1, current - 1),
                          )
                        }
                        className="campaign-number-btn flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-ink text-2xl font-black text-ink"
                      >
                        −
                      </button>

                      <div className="text-center">
                        <div className="font-display text-[2rem] leading-none text-ink">
                          {ticketQuantity}
                        </div>
                        <div className="text-[0.68rem] font-black uppercase tracking-[0.1em] text-ink/60">
                          Tickets
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setTicketQuantity((current) => current + 1)
                        }
                        className="campaign-number-btn flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-ink text-2xl font-black text-ink"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[16px] border-[3px] border-ink bg-[#f5f3ef] p-4">
                    <div className="flex items-center justify-between text-sm font-bold text-ink/70">
                      <span>Available balance</span>
                      <span>
                        {campaign.currency}{" "}
                        {displayedWalletBalance.toLocaleString("en-AE")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm font-bold text-ink/70">
                      <span>Cost</span>
                      <span>
                        {campaign.currency}{" "}
                        {totalTicketCost.toLocaleString("en-AE")}
                      </span>
                    </div>
                  </div>

                  {ticketError ? (
                    <p className="rounded-[12px] border-[3px] border-red bg-[#fff2f2] p-2 text-sm font-bold text-red">
                      {ticketError}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleQuantityNext}
                    className="campaign-action-btn w-full rounded-[16px] border-[3px] border-ink px-4 py-3 font-display text-lg uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#171310] transition-transform hover:-translate-y-0.5"
                  >
                    Buy
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[16px] border-[3px] border-ink bg-[#fff7dc] p-4 text-sm font-bold text-ink">
                    You are about to pay for{" "}
                    <span className="font-black">{ticketQuantity}</span> ticket
                    {ticketQuantity > 1 ? "s" : ""} using your wallet.
                  </div>

                  <div className="rounded-[16px] border-[3px] border-ink bg-[#f7f7f7] p-4 text-sm font-bold text-ink/75">
                    <div className="flex items-center justify-between">
                      <span>Tickets</span>
                      <span>{ticketQuantity}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Price each</span>
                      <span>
                        {campaign.currency}{" "}
                        {Number(campaign.entryFrom || 0).toLocaleString(
                          "en-AE",
                        )}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-base font-black text-ink">
                      <span>Total</span>
                      <span>
                        {campaign.currency}{" "}
                        {totalTicketCost.toLocaleString("en-AE")}
                      </span>
                    </div>
                  </div>

                  {ticketError ? (
                    <p className="rounded-[12px] border-[3px] border-red bg-[#fff2f2] p-2 text-sm font-bold text-red">
                      {ticketError}
                    </p>
                  ) : null}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTicketStage("quantity");
                        setTicketError("");
                      }}
                      className="flex-1 rounded-[14px] border-[3px] border-ink bg-[#f7f7f7] px-4 py-3 font-display text-base uppercase tracking-[0.06em] text-ink"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleBuyTickets}
                      disabled={buyingTickets}
                      className="flex-1 rounded-[14px] border-[3px] border-ink bg-[#1fbf73] px-4 py-3 font-display text-base uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_#171310] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {buyingTickets ? "Processing..." : "Pay now"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <Footer />
      </main>
    </>
  );
}

export default CampaignPage;
