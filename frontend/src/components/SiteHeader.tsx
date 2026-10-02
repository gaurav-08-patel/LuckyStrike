import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import { useAuth } from "../context/AuthContext";

type SiteHeaderProps = {
  brand: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
};

function useScrollProgress(fadeDistance = 120) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      setProgress(Math.min(window.scrollY / fadeDistance, 1));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, [fadeDistance]);

  return progress;
}

function SiteHeader({ brand, actionLabel }: SiteHeaderProps) {
  const progress = useScrollProgress(120);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const accountLabel = user?.firstName ? user.firstName : "Account";

  const openAuthModal = () => setIsAuthModalOpen(true);

  const handleSectionClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    event.preventDefault();

    const destination = `/#${sectionId}`;
    if (location.pathname === "/") {
      if (location.hash === `#${sectionId}`) {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      navigate(destination, { replace: false });
      return;
    }

    navigate(destination);
  };

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const element = document.getElementById(location.hash.replace("#", ""));
    if (element) {
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash, location.pathname]);

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <header
        className="sticky top-0 z-50 border-b-[2px] border-b-[#171310]/15 bg-white/80 backdrop-blur-[2px]"
        style={{
          backgroundColor: `rgba(255, 255, 255, ${progress})`,
          borderBottomColor: `rgba(23, 19, 16, ${Math.max(progress, 0.25)})`,
        }}
      >
        <div className="page-wrap flex items-center justify-between gap-4 py-4 sm:py-5">
          <a
            className="font-display text-2xl leading-none uppercase text-ink sm:text-3xl"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {brand}
          </a>

          <nav className="hidden min-[900px]:flex items-center gap-8">
            <a
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              href="/#how"
              onClick={(event) => handleSectionClick(event, "how")}
            >
              How it works
            </a>
            <a
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              href="/wallet"
              onClick={(event) => {
                event.preventDefault();
                navigate("/wallet");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Wallet
            </a>
            <a
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              href="/my-tickets"
              onClick={(event) => {
                event.preventDefault();
                navigate("/my-tickets");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              My Tickets
            </a>

            <a
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              href="/winners"
              onClick={(event) => {
                event.preventDefault();
                navigate("/winners");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Winners
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border-[3px] border-ink bg-[#ececec] px-2 py-1.5 text-left shadow-[3px_3px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5 sm:gap-3 sm:px-4 sm:py-2"
                onClick={() => navigate("/profile")}
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-[3px] border-ink bg-[#1d1d1d] text-[0.65rem] font-black uppercase text-white sm:h-9 sm:w-9 sm:text-xs">
                  A
                </span>
                <span className="text-[0.7rem] font-black uppercase text-ink sm:text-base">
                  {accountLabel}
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border-[3px] border-ink bg-[#ff3d8c] px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#171310] transition-all duration-200 hover:-translate-y-1 hover:shadow-[7px_7px_0_#171310] active:translate-y-0 active:shadow-[3px_3px_0_#171310] sm:px-5 sm:py-2.5 sm:text-sm sm:tracking-[0.12em]"
                onClick={openAuthModal}
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.5),_transparent_35%)]" />
                <span className="absolute inset-y-0 left-[-35%] w-[38%] -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80 blur-[1px] animate-[shine_3s_ease-in-out_infinite]" />
                <span className="relative z-10 whitespace-nowrap">
                  {actionLabel || "Login / Signup"}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default SiteHeader;
