import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const tabs = ["All campaigns", "Daily", "Weekly", "Monthly"] as const;
type CampaignTab = (typeof tabs)[number];

function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<CampaignTab>("All campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadCampaigns = async (nextOffset: number, append: boolean) => {
    const tabValue =
      activeTab === "All campaigns" ? "all" : activeTab.toLowerCase();
    const limit = 5;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/draws?limit=${limit}&offset=${nextOffset}${tabValue === "all" ? "" : `&drawType=${tabValue}`}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch campaigns");
      }

      const data = (await response.json()) as {
        draws?: Array<Record<string, unknown>>;
        hasMore?: boolean;
      };

      const normalized = Array.isArray(data.draws)
        ? data.draws.map((draw) => normalizeCampaignData(draw))
        : [];

      setCampaigns((current) =>
        append ? [...current, ...normalized] : normalized,
      );
      setHasMore(Boolean(data.hasMore));
      setOffset(nextOffset + normalized.length);
    } catch (error) {
      console.warn("Failed to load campaigns:", error);
      setCampaigns([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadCampaigns(0, false);
  }, [activeTab]);

  const handleShowMore = () => {
    if (!hasMore || loadingMore) {
      return;
    }

    void loadCampaigns(offset, true);
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
        actionLabel="Login / Signup"
      />

      <section className="mx-auto max-w-[1200px] px-3 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-pink">
              All draws
            </p>
            <h1 className="font-display text-[2.3rem] leading-none uppercase text-ink sm:text-[3rem]">
              Campaigns
            </h1>
          </div>

          <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:w-auto">
            <div className="flex min-w-max items-center gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 cursor-pointer border-4 border-ink px-3 py-2 text-xs font-bold whitespace-nowrap transition-all duration-150 sm:px-4 sm:text-sm ${
                    activeTab === tab
                      ? "bg-red text-white shadow-[3px_3px_0_var(--color-ink)]"
                      : "bg-paper text-ink shadow-[3px_3px_0_var(--color-ink)] hover:-translate-y-0.5"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border-[3px] border-ink bg-[#fffaf2] p-8 text-center shadow-[6px_6px_0_#171310]">
            <p className="font-display text-2xl uppercase tracking-[0.06em] text-ink sm:text-3xl">
              Loading campaigns...
            </p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-[28px] border-[3px] border-ink bg-[#fffaf2] p-8 text-center shadow-[6px_6px_0_#171310]">
            <p className="font-display text-2xl uppercase tracking-[0.06em] text-ink sm:text-3xl">
              No campaigns available
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {campaigns.map((campaign) => {
              const deadline = getCampaignDeadline(campaign);
              const remainingMs = deadline.getTime() - now.getTime();
              const isExpired = remainingMs <= 0;
              const dayMs = 24 * 60 * 60 * 1000;
              const showCountdown = !isExpired && remainingMs <= 2 * dayMs;
              const isJustLaunched =
                !isExpired &&
                remainingMs > 2 * dayMs &&
                remainingMs <= 7 * dayMs;
              const productTone = isExpired
                ? "bg-ink text-paper"
                : showCountdown
                  ? "bg-red text-white"
                  : "bg-[#3ACF7E] text-[#0d2a20]";

              const routeId = campaign.draw_code || campaign.id;

              return (
                <Link to={`/${routeId}`} key={routeId}>
                  <article className="relative mt-12 overflow-visible rounded-3xl border-4 border-ink bg-[#f5f5f5] shadow-[6px_6px_0_var(--color-ink)] transition-transform duration-150 hover:-translate-y-1 sm:mt-16">
                    <div className="absolute left-5 -top-7 z-10 -translate-y-1/2 max-sm:-top-6">
                      <div
                        className={`inline-flex h-14 w-64 max-w-full items-center justify-center gap-2 rounded-t-2xl border-4 border-ink border-b-0 px-3 py-2 shadow-[3px_3px_0_var(--color-ink)] max-sm:h-10 max-sm:w-48 ${productTone}`}
                      >
                        {isExpired ? (
                          <span className="text-[0.8rem] max-sm:text-[0.6rem] font-black uppercase tracking-[0.12em]">
                            Closed
                          </span>
                        ) : showCountdown ? (
                          <>
                            <span className="text-[0.8rem] max-sm:text-[0.6rem] font-black uppercase tracking-[0.12em]">
                              closing in
                            </span>
                            <span className="text-[1.1rem] font-black leading-none sm:text-[1.6rem]">
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
                    </div>

                    <div className="grid gap-3 p-2 pt-6 sm:gap-4 sm:p-3 sm:pt-7 md:grid-cols-[0.95fr_1.35fr] md:p-4 md:pt-8">
                      <div className="relative overflow-hidden rounded-3xl border-4 border-ink bg-paper p-2 sm:p-3">
                        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                          {campaign.entriesMultiplier ? (
                            <span className="border-4 border-ink bg-yellow px-2 py-1 text-[0.62rem] font-black uppercase text-ink">
                              {campaign.entriesMultiplier}
                            </span>
                          ) : null}
                        </div>

                        <img
                          src={campaign.image}
                          alt={campaign.title}
                          className="h-56 w-full rounded-2xl object-cover md:h-60"
                        />
                      </div>

                      <div className="flex flex-col justify-center rounded-3xl bg-[#f7f7f7] p-3 sm:p-4 md:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 sm:block">
                              <span className="font-display text-[1.5rem] leading-none uppercase text-red sm:text-[2rem]">
                                Win
                              </span>
                              <span className="font-display text-[1.35rem] leading-none uppercase text-ink sm:mt-2 sm:block sm:text-[1.75rem]">
                                {formatPrize(campaign)}
                              </span>
                            </div>
                            <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-ink/70 sm:mt-1 sm:text-sm">
                              {campaign.title}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="mt-1 inline-flex cursor-pointer items-center justify-center border-4 border-ink bg-[#4b5bdc] px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_var(--color-ink)] transition-transform duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_var(--color-ink)] sm:px-4 sm:py-3 sm:text-[0.7rem]"
                          >
                            Entry from {campaign.entryFrom}
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t-4 border-dashed border-ink pt-3 text-[0.78rem] font-bold text-ink/80">
                          <span>
                            Draw date: {formatDrawDateTime(campaign.drawDate)}{" "}
                            or earlier
                          </span>
                          <span className="text-[0.68rem] uppercase tracking-[0.08em] text-red">
                            DRAW CODE: {campaign.draw_code || campaign.id}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 text-[0.8rem] font-bold text-ink">
                          <span>
                            {isExpired ? (
                              <span className="inline-flex items-center border-4 border-ink bg-ink px-3 py-2 text-[1.05rem] font-black leading-none text-paper shadow-[2px_2px_0_var(--color-ink)]">
                                Closed
                              </span>
                            ) : showCountdown ? (
                              <span className="inline-flex items-center border-4 border-ink bg-red px-3 py-2 text-[1.05rem] font-black leading-none text-white shadow-[2px_2px_0_var(--color-ink)]">
                                {formatCountdown(deadline, now)}
                              </span>
                            ) : (
                              <span className="text-ink/70">
                                Open registration
                              </span>
                            )}
                          </span>

                          <span className="text-ink/70">
                            {campaign.currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}

            {hasMore && campaigns.length > 0 ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="inline-flex items-center justify-center border-4 border-ink bg-[#ffd400] px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-[4px_4px_0_var(--color-ink)] transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingMore ? "Loading..." : "Show more"}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

export default CampaignsPage;
