import SiteHeader from "../components/SiteHeader";
import WinnerCard from "../components/WinnerCard/WinnerCard";
import winnersData from "../data/winnersData";

function WinnersPage() {
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
          {winnersData.map((winner) => (
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
