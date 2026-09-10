import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";

type HeroSlide = {
  src: string;
  alt: string;
  tag: string;
};

const headerLinks = [
  { label: "How it works", href: "#hero" },
  { label: "Prize line-up", href: "#draw" },
  { label: "Winners", href: "#winners" },
];

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
    lastRegistration: null,
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
    lastRegistration: null,
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
    lastRegistration: null,
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
    lastRegistration: null,
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
    lastRegistration: null,
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
    lastRegistration: null,
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
    lastRegistration: null,
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
    lastRegistration: null,
    entriesMultiplier: null,
    image:
      "https://www.dreamdubai.com/on/demandware.static/-/Sites-dreamdubai-master-catalog/default/dwb7331206/images/campaignSliderImage/DE-00456-dashboard-image.jpg",
    soldCount: null,
    soldTotal: null,
  },
];

function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
        links={headerLinks}
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
                <a className="ticket-button ticket-button--red" href="#draw">
                  Get your entry
                </a>
                <a className="ticket-button ticket-button--outline" href="#how">
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
          <div className="flex items-center gap-3 rounded-full border-[3px] border-ink bg-paper/90 px-3 py-2 shadow-[3px_3px_0_var(--color-ink)] backdrop-blur-[1px]">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.alt}
                type="button"
                aria-label={`View slide ${index + 1}`}
                className={`h-2.5 rounded-full border-[2px] border-ink transition-all duration-300 ${
                  index === activeSlide ? "w-12 bg-red" : "w-3 bg-yellow"
                }`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
