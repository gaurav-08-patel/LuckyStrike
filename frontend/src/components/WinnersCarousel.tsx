import { useEffect, useRef, useState } from "react";
import WinnerCard from "./WinnerCard/WinnerCard";
import { normalizeWinnerData, type WinnerData } from "../data/winnersData";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function WinnersCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [winners, setWinners] = useState<WinnerData[]>([]);
  const dragStartX = useRef<number | null>(null);
  const cardWidth = 320;
  const gapWidth = 20;

  const navigate = useNavigate();

  useEffect(() => {
    const loadWinners = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/winners?limit=12`);
        if (!response.ok) {
          throw new Error("Failed to fetch winners");
        }

        const data = (await response.json()) as Array<Partial<WinnerData>>;
        if (Array.isArray(data) && data.length > 0) {
          setWinners(data.map(normalizeWinnerData));
        }
      } catch (error) {
        console.warn("Using fallback winners data:", error);
      }
    };

    void loadWinners();
  }, []);

  const hasWinners = winners.length > 0;
  const maxIndex = hasWinners ? Math.max(0, winners.length - 4) : 0;

  const moveBy = (direction: 1 | -1) => {
    setActiveIndex((prev) => {
      const next = direction === 1 ? prev + 1 : prev - 1;
      return Math.min(maxIndex, Math.max(0, next));
    });
  };

  useEffect(() => {
    if (isDragging) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= maxIndex) {
          return 0;
        }

        return prev + 1;
      });
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [isDragging, maxIndex]);

  const moveLeft = () => moveBy(-1);
  const moveRight = () => moveBy(1);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;

    const deltaX = event.clientX - dragStartX.current;
    setDragOffset(deltaX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;

    const deltaX = event.clientX - dragStartX.current;

    if (deltaX > 60) {
      moveLeft();
    } else if (deltaX < -60) {
      moveRight();
    }

    dragStartX.current = null;
    setIsDragging(false);
    setDragOffset(0);
    event.preventDefault();
  };

  if (!hasWinners) {
    return (
      <div className="relative">
        <div className="mb-8 flex justify-center py-10">
          <div className="rounded-full border-4 border-ink bg-[#f43d7e] px-8 py-4 shadow-[6px_6px_0_#171310]">
            <h2 className="font-display text-[2.2rem] leading-none uppercase text-white sm:text-[3rem]">
              Winners
            </h2>
          </div>
        </div>

        <div className="mx-auto max-w-2xl rounded-[28px] border-[3px] border-ink bg-[#fffaf2] p-8 text-center shadow-[6px_6px_0_#171310]">
          <p className="font-display text-2xl uppercase tracking-[0.06em] text-ink sm:text-3xl">
            No winners yet
          </p>
          <p className="mt-3 text-sm font-medium text-ink/70 sm:text-base">
            The latest lucky winner will appear here as soon as the draw is
            settled.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-[#f7f7f7] px-8 py-4 text-[1.05rem] font-black uppercase tracking-[0.06em] text-ink shadow-[4px_4px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5"
            onClick={() => {
              navigate("/winners");
            }}
          >
            See all winners
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-8 flex justify-center py-10">
        <div className="rounded-full border-4 border-ink bg-[#f43d7e] px-8 py-4 shadow-[6px_6px_0_#171310]">
          <h2 className="font-display text-[2.2rem] leading-none uppercase text-white sm:text-[3rem]">
            Winners
          </h2>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1280px]">
        <button
          type="button"
          aria-label="Previous winners"
          onClick={moveLeft}
          disabled={activeIndex === 0}
          className="absolute left-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-4 border-ink bg-white text-2xl font-black text-ink shadow-[3px_3px_0_#171310] transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ‹
        </button>

        <div
          className="overflow-hidden px-12 select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            touchAction: "pan-y",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          <div
            className="flex gap-5 transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(calc(-${activeIndex * (cardWidth + gapWidth)}px + ${dragOffset}px))`,
            }}
          >
            {winners.map((winner) => (
              <WinnerCard
                key={winner.id}
                winner={winner}
                width={`${cardWidth}px`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Next winners"
          onClick={moveRight}
          disabled={activeIndex >= maxIndex}
          className="absolute right-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-4 border-ink bg-white text-2xl font-black text-ink shadow-[3px_3px_0_#171310] transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ›
        </button>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-[#f7f7f7] px-8 py-4 text-[1.05rem] font-black uppercase tracking-[0.06em] text-ink shadow-[4px_4px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5"
          onClick={() => {
            navigate("/winners");
          }}
        >
          See all winners
        </button>
      </div>
    </div>
  );
}

export default WinnersCarousel;
