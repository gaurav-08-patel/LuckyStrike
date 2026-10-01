import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
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
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="min-h-screen bg-[#f3f0ee] text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
      />

      <section className="mx-auto max-w-[1200px] px-3 py-6 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/70 sm:mb-6 sm:text-sm">
          <Link to="/" className="transition-colors hover:text-red">
            Home
          </Link>
          <span>/</span>
          <span className="break-all">
            DRAW CODE: {campaign.draw_code || campaign.id}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[22px] border-[3px] border-ink bg-[#f8f7f6] shadow-[6px_6px_0_#171310] sm:rounded-[28px] sm:shadow-[8px_8px_0_#171310]">
          <div
            className={`absolute left-3 -top-6 z-10 -translate-y-1/2 inline-flex items-center justify-center gap-2 rounded-t-xl border-4 border-ink border-b-0 px-2 py-1.5 shadow-[3px_3px_0_var(--color-ink)] sm:left-5 sm:-top-7 sm:rounded-t-2xl sm:px-3 sm:py-2 ${productTone}`}
          >
            {isExpired ? (
              <span className="text-[0.6rem] font-black uppercase tracking-[0.12em] sm:text-[0.8rem]">
                Closed
              </span>
            ) : showCountdown ? (
              <>
                <span className="text-[0.55rem] font-black uppercase tracking-[0.12em] sm:text-[0.8rem]">
                  closing in
                </span>
                <span className="text-[0.9rem] font-black leading-none sm:text-[1.2rem] lg:text-[1.6rem]">
                  {formatCountdown(deadline, now)}
                </span>
              </>
            ) : isJustLaunched ? (
              <span className="text-[0.55rem] font-black uppercase tracking-[0.12em] sm:text-[0.8rem]">
                just launched
              </span>
            ) : (
              <span className="text-[0.55rem] font-black uppercase tracking-[0.12em] sm:text-[0.8rem]">
                registration open
              </span>
            )}
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden border-b-[3px] border-ink bg-[#d9d7d6] p-3 sm:p-4 lg:border-b-0 lg:border-r-[3px]">
              <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                {campaign.entriesMultiplier ? (
                  <span className="border-[3px] border-ink bg-yellow px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink">
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

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink/60 sm:text-sm">
                  DRAW CODE: {campaign.draw_code || campaign.id}
                </span>
              </div>

              <div className="mb-3 flex flex-wrap items-end gap-2 sm:mb-4 sm:gap-3">
                <span className="font-display text-[1.6rem] uppercase leading-none tracking-[-0.06em] text-red sm:text-[2.1rem] lg:text-[2.8rem]">
                  Win
                </span>
                <span className="font-display text-[1.5rem] uppercase leading-none tracking-[-0.06em] text-ink sm:text-[2rem] lg:text-[2.8rem]">
                  {formatPrize(campaign)}
                </span>
              </div>

              <div className="mb-4 rounded-[14px] border-[3px] border-ink bg-paper px-3 py-2 text-center shadow-[3px_3px_0_#171310] sm:mb-5 sm:rounded-[18px] sm:px-5 sm:py-3">
                <div className="font-display text-[0.8rem] uppercase leading-none tracking-[-0.02em] text-ink sm:text-[1.1rem] lg:text-[1.4rem]">
                  {isExpired
                    ? "Closed"
                    : showCountdown
                      ? formatCountdown(deadline, now)
                      : "Live draw"}
                </div>
              </div>

              <div className="mb-5">
                <style>{`
                  .glow-entry-button{ 
                    background: linear-gradient(90deg,#ff6aa6 0%,#ff3b8d 50%,#ff6aa6 100%);
                    box-shadow: 0 10px 30px rgba(255,59,141,0.18), 0 0 0 6px rgba(255,59,141,0.03) inset;
                    border-color: rgba(23,17,16,1);
                  }
                  .glow-entry-button:hover{ 
                    transform: translateY(-3px);
                    box-shadow: 0 14px 40px rgba(255,59,141,0.28), 0 0 0 8px rgba(255,59,141,0.04) inset;
                  }
                  .glow-entry-button:active{ transform: translateY(-1px); }
                  .glow-entry-button .shine{ 
                    position:absolute; top:0; left:-60%; width:60%; height:100%;
                    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%);
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
                  className={`relative overflow-hidden flex w-full items-center justify-center rounded-[18px] border-[3px] border-ink px-3 py-3 font-display text-[1rem] uppercase tracking-[0.06em] transition-all duration-200 sm:rounded-[22px] sm:px-5 sm:py-4 sm:text-[1.6rem] ${
                    isExpired
                      ? "cursor-not-allowed bg-[#d9d7d6] text-ink/50 opacity-80"
                      : "glow-entry-button text-white"
                  }`}
                >
                  {isExpired
                    ? "Closed"
                    : `BUY TICKET ${campaign.currency} ${campaign.cashPrizeValue ?? campaign.entryFrom}`}
                  {!isExpired && <span className="shine" aria-hidden="true" />}
                </button>
              </div>

              <div className="space-y-2 text-sm font-medium text-ink/80 sm:space-y-3 sm:text-base">
                <p>
                  Redeem your credit at Modesh{" "}
                  <span className="font-black">i</span>
                </p>
                <p className="break-words">
                  Draw date: {formatDrawDateTime(campaign.drawDate)} or earlier.
                </p>
                <p className="break-words">Prize title: {campaign.title}</p>
                <p className="break-all">
                  DRAW CODE: {campaign.draw_code || campaign.id}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-ink/80 sm:mt-6 sm:gap-3 sm:text-sm">
                <div className="rounded-[14px] border-[3px] border-ink bg-[#f7f7f7] p-2 sm:rounded-[18px] sm:p-3">
                  Prize type
                  <div className="mt-2 text-[11px] normal-case tracking-normal text-ink sm:text-base">
                    {campaign.prizeType}
                  </div>
                </div>
                <div className="rounded-[14px] border-[3px] border-ink bg-[#f7f7f7] p-2 sm:rounded-[18px] sm:p-3">
                  Currency
                  <div className="mt-2 text-[11px] normal-case tracking-normal text-ink sm:text-base">
                    {campaign.currency}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[18px] border-[3px] border-ink bg-paper p-4 shadow-[4px_4px_0_#171310] sm:mt-8 sm:rounded-[22px] sm:p-6 sm:shadow-[5px_5px_0_#171310]">
          <p className="text-base leading-relaxed text-ink sm:text-lg">
            Dream Big! The possibilities are endless. Whether you&apos;re
            dreaming of a holiday, making a statement purchase or starting a
            savings account, winning cash can go a long way towards making your
            dreams a reality. Participate now!
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default CampaignPage;
