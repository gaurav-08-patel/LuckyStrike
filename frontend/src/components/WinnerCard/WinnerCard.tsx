import type { WinnerData } from "../../data/winnersData";

export type Winner = WinnerData;

export type WinnerCardProps = {
  winner: Winner;
  width?: string;
  className?: string;
};

const moneyFormatter = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

const formatDate = (value: Date | string) => {
  const date = new Date(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function WinnerCard({
  winner,
  width = "clamp(260px, 30vw, 320px)",
  className = "",
}: WinnerCardProps) {
  return (
    <article
      className={`min-w-0 shrink-0 ${className}`.trim()}
      style={{ width, flexBasis: width }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[22px] border-2 border-ink bg-paper shadow-[6px_6px_0_#171310]">
        <div className="border-b-2 border-ink bg-[#fff0f5] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="inline-flex border-2 border-ink bg-yellow px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink">
              Winner
            </span>
            <span className="font-display text-lg uppercase text-ink">
              {winner.id}
            </span>
          </div>

          <img
            src={winner.image}
            alt={winner.name}
            className="h-56 w-full rounded-[18px] border-2 border-ink object-cover select-none"
          />
        </div>

        <div className="flex flex-1 flex-col justify-between space-y-3 bg-paper p-4">
          <div className="flex min-h-[3.75rem] items-center justify-between gap-3 border-b-2 border-ink pb-2">
            <span className="font-display text-xl uppercase leading-none text-ink">
              {winner.name}
            </span>
            <span className="font-display text-xl uppercase leading-none text-red">
              {moneyFormatter.format(winner.cash)}
            </span>
          </div>

          <div className="space-y-1 text-[0.8rem] font-bold text-ink/80">
            <p>Entry no: {winner.entry_no}</p>
            <p>Announced: {formatDate(winner.announced_on)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default WinnerCard;
