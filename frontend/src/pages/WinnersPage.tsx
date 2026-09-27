import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import WinnerCard from "../components/WinnerCard/WinnerCard";
import { normalizeWinnerData, type WinnerData } from "../data/winnersData";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function WinnersPage() {
  const [winners, setWinners] = useState<WinnerData[]>([]);

  useEffect(() => {
    const loadWinners = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/winners?limit=24`);
        if (!response.ok) {
          throw new Error("Failed to fetch winners");
        }

        const data = (await response.json()) as Array<Partial<WinnerData>>;
        if (Array.isArray(data) && data.length > 0) {
          setWinners(data.map(normalizeWinnerData));
        }
      } catch (error) {
        console.warn("Using fallback winners page data:", error);
      }
    };

    void loadWinners();
  }, []);

  if (winners.length === 0) {
    return (
      <main className="min-h-screen bg-[#f9f2ee] text-ink">
        <SiteHeader
          brand={
            <>
              Lucky<span className="text-red">Strike</span>
            </>
          }
        />

        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border-[3px] border-ink bg-[#fffaf2] p-8 text-center shadow-[6px_6px_0_#171310] sm:p-12">
            <span className="mb-4 inline-flex border-[3px] border-ink bg-[#f8d95b] px-3 py-1 font-display text-sm uppercase tracking-[0.12em] text-ink shadow-[3px_3px_0_#171310]">
              Hall of fame
            </span>
            <h1 className="font-display text-4xl uppercase leading-none tracking-[-0.06em] text-ink sm:text-5xl">
              No winners yet
            </h1>
            <p className="mt-4 text-base font-medium text-ink/70 sm:text-lg">
              The latest lucky winner will appear here as soon as a draw is
              settled.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f9f2ee] text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="mb-3 inline-flex border-[3px] border-ink bg-[#f8d95b] px-3 py-1 font-display text-sm uppercase tracking-[0.12em] text-ink shadow-[3px_3px_0_#171310]">
              Hall of fame
            </span>
            <h1 className="font-display text-4xl uppercase leading-none tracking-[-0.06em] text-ink sm:text-5xl lg:text-6xl">
              Winners
            </h1>
          </div>

          <p className="max-w-xl text-sm font-medium text-ink/70 sm:text-base">
            Recent lucky winners from our latest draws and campaigns. Every
            result is verified and announced with the winning entry number.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {winners.map((winner) => (
            <WinnerCard
              key={`${winner.id}-${winner.entry_no}`}
              winner={winner}
              width="100%"
              className="w-full"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default WinnersPage;
