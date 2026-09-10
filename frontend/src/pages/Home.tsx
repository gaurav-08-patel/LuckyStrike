import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";

type CarouselSlide = {
  label: string;
  title: string;
  copy: string;
  accentClass: string;
  stat: string;
};

const headerLinks = [
  { label: "How it works", href: "#hero" },
  { label: "Prize line-up", href: "#carousel" },
  { label: "Winners", href: "#carousel" },
];

const carouselSlides: CarouselSlide[] = [
  {
    label: "Main draw",
    title: "Lucky ticket energy",
    copy: "Bold poster headlines, stamped borders, and a rotating prize story that keeps the focus on the win.",
    accentClass: "bg-yellow-tint",
    stat: "01",
  },
  {
    label: "Fast entry",
    title: "Simple, loud, direct",
    copy: "The layout stays clean and punchy so each prize card reads like a real ticket stub.",
    accentClass: "bg-pink-tint",
    stat: "02",
  },
  {
    label: "Live moment",
    title: "Built to move",
    copy: "The hero carousel slides automatically while the rest of the page stays ready for the next section later.",
    accentClass: "bg-warm",
    stat: "03",
  },
];

function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide(
        (currentSlide) => (currentSlide + 1) % carouselSlides.length,
      );
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
        className="relative overflow-hidden border-b-[3px] border-ink bg-paper"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[-8%] top-[-10%] h-64 w-64 rounded-full bg-yellow/35" />
          <div className="absolute right-[8%] top-[10%] h-56 w-56 rounded-full bg-pink/20" />
          <div className="absolute bottom-[-8%] left-[24%] h-40 w-40 rounded-full bg-red/15" />
        </div>

        <div className="page-wrap relative grid gap-10 py-14 sm:py-16 min-[900px]:grid-cols-[1.05fr_0.95fr] min-[900px]:items-center min-[900px]:py-24">
          <div className="max-w-2xl">
            <span className="ticket-chip mb-5 px-4 py-2">
              Draw closes in 4 days
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
              <a className="ticket-button ticket-button--red" href="#carousel">
                Get your entry
              </a>
              <a className="ticket-button ticket-button--outline" href="#hero">
                See how it works
              </a>
            </div>
          </div>

          <div
            className="stamped-panel relative overflow-hidden bg-paper"
            id="carousel"
          >
            <div
              className="flex min-h-[26rem] transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {carouselSlides.map((slide) => (
                <article
                  key={slide.label}
                  className={`min-w-full ${slide.accentClass} px-6 py-6 sm:px-8 sm:py-8`}
                >
                  <div className="flex h-full min-h-[22rem] flex-col justify-between border-[3px] border-ink bg-paper p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <span className="ticket-chip px-3 py-2">
                        {slide.label}
                      </span>
                      <span className="font-display text-4xl leading-none text-red">
                        {slide.stat}
                      </span>
                    </div>

                    <div className="pt-10">
                      <h2 className="max-w-sm font-display text-[2rem] leading-[0.96] uppercase text-ink sm:text-[2.6rem]">
                        {slide.title}
                      </h2>
                      <p className="mt-4 max-w-md text-[1rem] font-medium leading-[1.55] text-ink sm:text-[1.1rem]">
                        {slide.copy}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4 border-t-[3px] border-dashed border-ink pt-4">
                      <span className="text-sm font-bold text-pink">
                        Auto-rotating hero
                      </span>
                      <span className="font-display text-2xl leading-none text-ink">
                        0{activeSlide + 1}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 border-t-[3px] border-ink bg-paper px-6 py-4 sm:px-8">
              {carouselSlides.map((slide, index) => (
                <button
                  key={slide.label}
                  className={`h-3 w-3 rounded-full border-[3px] border-ink transition-colors duration-150 ${
                    index === activeSlide ? "bg-red" : "bg-yellow"
                  }`}
                  aria-label={`Go to ${slide.label}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
