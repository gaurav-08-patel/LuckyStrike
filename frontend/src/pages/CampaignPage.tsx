import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import {
  allCampaigns,
  formatCountdown,
  formatPrize,
  getCampaignDeadline,
} from "./Home";

function CampaignPage() {
  const { id } = useParams();
  const campaign = allCampaigns.find((item) => item.id === id);

  if (!campaign) {
    return <Navigate to="/" replace />;
  }

  // live "now" state so countdown updates without reload
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const deadline = getCampaignDeadline(campaign);
  const remainingMs = Math.max(deadline.getTime() - now.getTime(), 0);
  const showCountdown =
    remainingMs > 0 && remainingMs <= 2 * 24 * 60 * 60 * 1000;
  const isJustLaunched =
    remainingMs > 0 &&
    remainingMs > 2 * 24 * 60 * 60 * 1000 &&
    remainingMs <= 7 * 24 * 60 * 60 * 1000;
  const productTone = showCountdown
    ? "bg-red text-white"
    : isJustLaunched
      ? "bg-[#3ACF7E] text-[#0d2a20]"
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

      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-bold uppercase tracking-[0.12em] text-ink/70">
          <Link to="/" className="transition-colors hover:text-red">
            Home
          </Link>
          <span>/</span>
          <span>{campaign.id}</span>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border-[3px] border-ink bg-[#f8f7f6] shadow-[8px_8px_0_#171310]">
          {/* popup label similar to Home */}
          <div
            className={`absolute left-5 -top-7 z-10 -translate-y-1/2 max-sm:-top-6 inline-flex items-center justify-center gap-2 rounded-t-2xl border-4 border-ink border-b-0 px-3 py-2 shadow-[3px_3px_0_var(--color-ink)] ${productTone}`}
          >
            {showCountdown ? (
              <>
                <span className="text-[0.8rem] max-sm:text-[0.6rem] font-black uppercase tracking-[0.12em]">
                  closing in
                </span>
                <span className="text-[1.2rem] font-black leading-none sm:text-[1.6rem]">
                  {formatCountdown(deadline, now)}
                </span>
              </>
            ) : isJustLaunched ? (
              <span className="text-[0.8rem] max-sm:text-[0.6rem] font-black uppercase tracking-[0.12em]">
                just launched
              </span>
            ) : (
              <span className="text-[0.8rem] max-sm:text-[0.6rem] font-black uppercase tracking-[0.12em]">
                registration open
              </span>
            )}
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden border-b-[3px] border-ink bg-[#d9d7d6] p-4 lg:border-b-0 lg:border-r-[3px]">
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
                className="h-[420px] w-full rounded-[24px] border-[3px] border-ink object-cover sm:h-[500px]"
              />
            </div>

            <div className="p-5 sm:p-6 lg:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="text-sm font-bold uppercase tracking-[0.12em] text-ink/60">
                  {campaign.id}
                </span>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <span className="font-display text-[2.1rem] uppercase leading-none tracking-[-0.06em] text-red sm:text-[2.8rem]">
                  Win
                </span>
                <span className="font-display text-[2rem] uppercase leading-none tracking-[-0.06em] text-ink sm:text-[2.8rem]">
                  {formatPrize(campaign)}
                </span>
              </div>

              <div className="mb-5 rounded-[18px] border-[3px] border-ink bg-paper px-4 py-3 text-center shadow-[3px_3px_0_#171310] sm:px-5">
                <div className="font-display text-[1.1rem] uppercase leading-none tracking-[-0.02em] text-ink sm:text-[1.4rem]">
                  {showCountdown ? formatCountdown(deadline, now) : "Live draw"}
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
                  className="glow-entry-button relative overflow-hidden flex w-full items-center justify-center rounded-[22px] border-[3px] border-ink px-5 py-4 font-display text-[1.6rem] uppercase tracking-[0.06em] text-white transition-all duration-200"
                >
                  Entry from {campaign.entryFrom}
                  <span className="shine" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-3 text-base font-medium text-ink/80">
                <p>
                  Redeem your credit at Modesh{" "}
                  <span className="font-black">i</span>
                </p>
                <p>
                  Draw date:{" "}
                  {new Date(campaign.drawDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  or earlier.
                </p>
                <p>ID: {campaign.id}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm font-bold uppercase tracking-[0.08em] text-ink/80">
                <div className="rounded-[18px] border-[3px] border-ink bg-[#f7f7f7] p-3">
                  Prize type
                  <div className="mt-2 text-base normal-case tracking-normal text-ink">
                    {campaign.prizeType}
                  </div>
                </div>
                <div className="rounded-[18px] border-[3px] border-ink bg-[#f7f7f7] p-3">
                  Currency
                  <div className="mt-2 text-base normal-case tracking-normal text-ink">
                    {campaign.currency}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[22px] border-[3px] border-ink bg-paper p-5 shadow-[5px_5px_0_#171310] sm:p-6">
          <p className="text-lg leading-relaxed text-ink">
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
