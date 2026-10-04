import { useEffect, useState } from "react";
import HowItWorks from "../components/HowItWorks";
import SiteHeader from "../components/SiteHeader";
import WinnersCarousel from "../components/WinnersCarousel";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { normalizeCampaignData, type Campaign } from "../data/campaignsData";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type HeroSlide = {
  src: string;
  alt: string;
  tag: string;
};

const heroSlides: HeroSlide[] = [
  {
    src: "/Carousel/Web_5mRefresh_retro.webp",
    alt: "Lucky Strike retro draw art",
    tag: "4 days left",
  },
  {
    src: "/Carousel/image2.png",
    alt: "Lucky Strike prize poster",
    tag: "Now live",
  },
  {
    src: "/Carousel/image2.png",
    alt: "Lucky Strike prize posterss",
    tag: "Now live",
  },
];

export const allCampaigns: Campaign[] = [];

const tabs = ["All campaigns", "Daily", "Weekly", "Monthly"] as const;
type CampaignTab = (typeof tabs)[number];

export const formatPrize = (campaign: Campaign) => {
  if (campaign.prizeType === "Cash" && campaign.cashPrizeValue !== null) {
    return `${campaign.currency} ${campaign.cashPrizeValue.toLocaleString("en-AE")}`;
  }

  if (campaign.prizeType === "Car") {
    return "Car prize";
  }

  if (campaign.prizeType === "Electronics") {
    return "Electronics prize";
  }

  return campaign.title;
};

export const getCampaignDeadline = (campaign: Campaign) => {
  if (campaign.lastRegistration) {
    return new Date(campaign.lastRegistration);
  }

  const drawDate = new Date(campaign.drawDate);
  return new Date(drawDate.getTime() - 36 * 60 * 60 * 1000);
};

export const formatCountdown = (deadline: Date, now: Date) => {
  const leftMs = Math.max(deadline.getTime() - now.getTime(), 0);
  if (leftMs <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(leftMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

export const formatDrawDateTime = (value: string) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<CampaignTab>("All campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const clock = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/draws?limit=5&offset=0`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch draws");
        }

        const data = (await response.json()) as {
          draws?: Array<Record<string, unknown>>;
        };
        const normalizedCampaigns = Array.isArray(data.draws)
          ? data.draws.map((draw) => normalizeCampaignData(draw))
          : [];

        allCampaigns.splice(0, allCampaigns.length, ...normalizedCampaigns);
        setCampaigns(normalizedCampaigns);
      } catch (error) {
        console.warn("No draws available from backend right now:", error);
        allCampaigns.splice(0, allCampaigns.length);
        setCampaigns([]);
      }
    };

    void loadCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (activeTab === "All campaigns") {
      return true;
    }

    return campaign.campaignType === activeTab.toLowerCase();
  });

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

      <section
        id="hero"
        className="relative overflow-hidden border-b-[3px] border-ink bg-warm"
      >
        <div className="absolute inset-0 overflow-hidden">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.alt}
              className="absolute inset-0 transition-opacity duration-700 ease-out"
              style={{
                opacity: index === activeSlide ? 1 : 0,
                visibility: index === activeSlide ? "visible" : "hidden",
              }}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,251,247,0.9)_0%,rgba(255,251,247,0.72)_34%,rgba(255,251,247,0.26)_100%)]" />
            </div>
          ))}

          <div className="absolute left-[-8%] top-[-10%] h-64 w-64 rounded-full bg-yellow/45" />
          <div className="absolute right-[8%] top-[10%] h-56 w-56 rounded-full bg-pink/20" />
          <div className="absolute bottom-[-8%] left-[24%] h-40 w-40 rounded-full bg-red/15" />
        </div>

        <div className="page-wrap relative z-10 py-14 sm:py-16 min-[900px]:py-24">
          <div className="grid gap-8 min-[900px]:grid-cols-[1.05fr_0.95fr] min-[900px]:items-center">
            <div className="max-w-2xl">
              <span className="ticket-chip mb-5 px-4 py-2">
                {heroSlides[activeSlide].tag}
              </span>
              <h1 className="max-w-xl font-display text-[2.8rem] leading-[0.96] uppercase text-ink sm:text-[4.4rem]">
                Your{" "}
                <span
                  className="text-pink"
                  style={{ WebkitTextStroke: "2px var(--color-ink)" }}
                >
                  lucky
                </span>
                <br />
                number is waiting.
              </h1>
              <p className="mt-6 max-w-xl text-[1rem] font-medium leading-[1.55] text-ink sm:text-[1.15rem]">
                Grab an entry, hold your ticket, and watch the draw happen live.
                Simple as that.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  className="ticket-button ticket-button--red cursor-pointer"
                  href="#draw"
                >
                  Get your entry
                </a>
                <a
                  className="ticket-button ticket-button--outline cursor-pointer"
                  href="#how"
                >
                  See how it works
                </a>
              </div>
            </div>

            <div
              className="min-[900px]:justify-self-end min-[900px]:w-full"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border-4 border-ink bg-paper/90 px-3 py-2 shadow-[3px_3px_0_var(--color-ink)] backdrop-blur-[1px]">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.alt}
                type="button"
                aria-label={`View slide ${index + 1}`}
                className={`cursor-pointer h-2.5 rounded-full border-2 border-ink transition-all duration-300 ${
                  index === activeSlide ? "w-12 bg-red" : "w-3 bg-yellow"
                }`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="draw" className="bg-paper py-14 sm:py-16">
        <div className="page-wrap">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-pink">
                Draws
              </p>
              <h2 className="font-display text-[2.2rem] leading-none uppercase text-ink sm:text-[2.8rem]">
                Campaigns
              </h2>
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

          <div className="mb-5 flex justify-end">
            <Link
              to="/campaigns"
              className="inline-flex items-center justify-center border-4 border-ink bg-[#ffd400] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-ink shadow-[3px_3px_0_var(--color-ink)] transition-transform duration-150 hover:-translate-y-0.5"
            >
              Show All
            </Link>
          </div>

          <div className="space-y-5">
            {filteredCampaigns.length === 0 ? (
              <div className="rounded-[28px] border-[3px] border-ink bg-[#fffaf2] p-8 text-center shadow-[6px_6px_0_#171310]">
                <p className="font-display text-2xl uppercase tracking-[0.06em] text-ink sm:text-3xl">
                  No campaigns available
                </p>
                <p className="mt-3 text-sm font-medium text-ink/70 sm:text-base">
                  There are no active draws right now. Please check back soon
                  for the next lucky draw.
                </p>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => {
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
              })
            )}
          </div>
        </div>
      </section>
      <HowItWorks />
      <WinnersCarousel />
      <div className="mt-10" />
      <Footer />
    </main>
  );
}

export default Home;
