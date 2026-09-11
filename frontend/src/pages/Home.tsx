import { useEffect, useState } from "react";
import HowItWorks from "../components/HowItWorks";
import SiteHeader from "../components/SiteHeader";
import WinnersCarousel from "../components/WinnersCarousel";

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

interface Campaign {
  id: string;
  title: string;
  prizeType: "Cash" | "Car" | "Electronics" | string;
  cashPrizeValue: number | null;
  currency: string;
  entryFrom: number;
  drawDate: string;
  lastRegistration: string | null;
  campaignType: "daily" | "weekly" | "monthly";
  entriesMultiplier: string | null;
  image: string;
  soldCount: number | null;
  soldTotal: number | null;
}

const allCampaigns: Campaign[] = [
  {
    id: "DC-01078",
    title: "1,000,000 Cash",
    prizeType: "Cash",
    cashPrizeValue: 1000000,
    currency: "AED",
    entryFrom: 75,
    drawDate: "2026-09-15",
    lastRegistration: "2026-09-11T18:00:00Z",
    campaignType: "daily",
    entriesMultiplier: null,
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw7ce2676d/images/campaignSliderImage/DC-01078-dashboard-image-2.png",
    soldCount: null,
    soldTotal: null,
  },
  {
    id: "DC-01133",
    title: "300,000 Cash",
    prizeType: "Cash",
    cashPrizeValue: 300000,
    currency: "AED",
    entryFrom: 30,
    drawDate: "2026-10-15",
    lastRegistration: "2026-10-13T20:30:00Z",
    campaignType: "monthly",
    entriesMultiplier: null,
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw8037f828/images/campaignSliderImage/DC-01105-dashboard-image.png",
    soldCount: null,
    soldTotal: null,
  },
  {
    id: "DC-01128",
    title: "100,000 Cash",
    prizeType: "Cash",
    cashPrizeValue: 100000,
    currency: "AED",
    entryFrom: 20,
    drawDate: "2026-09-17",
    lastRegistration: "2026-09-13T16:00:00Z",
    campaignType: "weekly",
    entriesMultiplier: null,
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw888f85b6/images/campaignSliderImage/DC-01119-dashboard-image.png",
    soldCount: null,
    soldTotal: null,
  },
  {
    id: "DC-01131",
    title: "25,000 Cash",
    prizeType: "Cash",
    cashPrizeValue: 25000,
    currency: "AED",
    entryFrom: 7.5,
    drawDate: "2026-09-17",
    lastRegistration: "2026-09-12T19:15:00Z",
    campaignType: "daily",
    entriesMultiplier: "Offer Available",
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw19a67e88/images/campaignSliderImage/DC-00992-dashboard-image.jpg",
    soldCount: null,
    soldTotal: null,
  },
  {
    id: "DC-00961",
    title: "5,000,000 Cash",
    prizeType: "Cash",
    cashPrizeValue: 5000000,
    currency: "AED",
    entryFrom: 200,
    drawDate: "2026-12-03",
    lastRegistration: "2026-12-01T12:00:00Z",
    campaignType: "monthly",
    entriesMultiplier: null,
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dwa5f92efc/images/campaignSliderImage/DC-00961-dashboard-image8.png",
    soldCount: null,
    soldTotal: null,
  },
  {
    id: "DA-00061",
    title: "The Mercedes-AMG G 63",
    prizeType: "Car",
    cashPrizeValue: null,
    currency: "AED",
    entryFrom: 100,
    drawDate: "2026-12-03",
    lastRegistration: "2026-12-01T13:30:00Z",
    campaignType: "monthly",
    entriesMultiplier: "Offer Available",
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw231fd485/images/campaignSliderImage/DA-00061-dashboard-image6.jpg",
    soldCount: null,
    soldTotal: null,
  },
  {
    id: "DC-01113",
    title: "50,000 Cash",
    prizeType: "Cash",
    cashPrizeValue: 50000,
    currency: "AED",
    entryFrom: 10,
    drawDate: "2026-09-15",
    lastRegistration: "2026-09-11T22:45:00Z",
    campaignType: "daily",
    entriesMultiplier: null,
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dw67c0ee1f/images/campaignSliderImage/DC-00986-dashboard-image.jpg",
    soldCount: null,
    soldTotal: null,
  },
  {
    id: "DE-00456",
    title: "Samsung Galaxy Z Fold8",
    prizeType: "Electronics",
    cashPrizeValue: null,
    currency: "AED",
    entryFrom: 5,
    drawDate: "2026-09-17",
    lastRegistration: "2026-09-13T21:00:00Z",
    campaignType: "weekly",
    entriesMultiplier: null,
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dwb7331206/images/campaignSliderImage/DE-00456-dashboard-image.jpg",
    soldCount: null,
    soldTotal: null,
  },
];

const tabs = ["All campaigns", "Daily", "Weekly", "Monthly"] as const;
type CampaignTab = (typeof tabs)[number];

const formatPrize = (campaign: Campaign) => {
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

const getCampaignDeadline = (campaign: Campaign) => {
  if (campaign.lastRegistration) {
    return new Date(campaign.lastRegistration);
  }

  const drawDate = new Date(campaign.drawDate);
  return new Date(drawDate.getTime() - 36 * 60 * 60 * 1000);
};

const formatCountdown = (deadline: Date, now: Date) => {
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

function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<CampaignTab>("All campaigns");
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

  const filteredCampaigns = allCampaigns.filter((_campaign) => {
    if (activeTab === "All campaigns") {
      return true;
    }

    // Keep these tabs visible for future enum-based campaignType grouping,
    // but leave them empty until the campaign data is updated with the new type field.
    if (
      activeTab === "Daily" ||
      activeTab === "Weekly" ||
      activeTab === "Monthly"
    ) {
      return false;
    }

    return false;
  });

  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
        actionLabel="Enter now"
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

            <div className="flex flex-wrap items-center gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`cursor-pointer border-4 border-ink px-4 py-2 text-sm font-bold transition-all duration-150 ${
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

          <div className="space-y-5">
            {filteredCampaigns.map((campaign) => {
              const deadline = getCampaignDeadline(campaign);
              const remainingMs = Math.max(
                deadline.getTime() - now.getTime(),
                0,
              );
              const dayMs = 24 * 60 * 60 * 1000;
              const showCountdown = remainingMs > 0 && remainingMs <= 2 * dayMs;
              const isJustLaunched =
                remainingMs > 0 &&
                remainingMs > 2 * dayMs &&
                remainingMs <= 7 * dayMs;
              const productTone = showCountdown
                ? "bg-red text-white"
                : "bg-[#3ACF7E] text-[#0d2a20]";

              return (
                <article
                  key={campaign.id}
                  className="relative mt-16 overflow-visible rounded-3xl border-4 border-ink bg-[#f5f5f5] shadow-[6px_6px_0_var(--color-ink)] transition-transform duration-150 hover:-translate-y-1"
                >
                  <div className="absolute left-5 -top-7 z-10 -translate-y-1/2 max-sm:-top-6">
                    <div
                      className={`inline-flex h-14 w-56 max-w-full items-center justify-center gap-2 rounded-t-2xl border-4 border-ink border-b-0 px-3 py-2 shadow-[3px_3px_0_var(--color-ink)] max-sm:h-10 max-sm:w-48 ${productTone}`}
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
                  </div>

                  <div className="grid gap-4 p-3 pt-7 md:grid-cols-[0.95fr_1.35fr] md:p-4 md:pt-8">
                    <div className="relative overflow-hidden rounded-3xl border-4 border-ink bg-paper p-3">
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

                    <div className="flex flex-col justify-center rounded-3xl bg-[#f7f7f7] p-4 md:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col">
                          <span className="font-display text-[2rem] leading-none uppercase text-red">
                            Win
                          </span>
                          <span className="mt-2 font-display text-[1.75rem] leading-none uppercase text-ink sm:text-[2.1rem]">
                            {formatPrize(campaign)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="cursor-pointer inline-flex items-center justify-center border-4 border-ink bg-[#4b5bdc] px-4 py-3 text-[0.7rem] font-black uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_var(--color-ink)] transition-transform duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_var(--color-ink)]"
                        >
                          Entry from {campaign.entryFrom}
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t-4 border-dashed border-ink pt-3 text-[0.78rem] font-bold text-ink/80">
                        <span>
                          Draw date:{" "}
                          {new Date(campaign.drawDate).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </span>
                        <span className="text-[0.68rem] uppercase tracking-[0.08em] text-red">
                          {campaign.id}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 text-[0.8rem] font-bold text-ink">
                        <span>
                          {showCountdown ? (
                            <span className="inline-flex items-center border-4 border-ink bg-red px-3 py-2 text-[1.05rem] font-black leading-none text-white shadow-[2px_2px_0_var(--color-ink)]">
                              {formatCountdown(deadline, now)}
                            </span>
                          ) : (
                            <span className="text-ink/70">
                              Open registration
                            </span>
                          )}
                        </span>

                        <span className="text-ink/70">{campaign.currency}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <HowItWorks />
      <WinnersCarousel />
    </main>
  );
}

export default Home;
