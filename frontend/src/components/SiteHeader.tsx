import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import { toast } from "./ui/Toast";
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
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const accountLabel = user?.firstName ? user.firstName : "Account";
  const avatarUrl = user?.profileImage ?? null;
  const accountInitial = (
    user?.firstName?.[0] ??
    user?.lastName?.[0] ??
    "A"
  ).toUpperCase();

  const openAuthModal = (redirectTarget?: string) => {
    if (redirectTarget) {
      setPendingRedirect(redirectTarget);
    }
    setIsAuthModalOpen(true);
  };

  const handleProtectedNavigation = (target: string) => {
    if (!isLoggedIn) {
      toast.error("Login first", "Please sign in to continue.");
      openAuthModal(target);
      return;
    }

    navigate(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth >= 900) {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        redirectAfterLogin={pendingRedirect ?? undefined}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingRedirect(null);
        }}
      />

      <header
        className="sticky top-0 z-50 border-b-[2px] border-b-[#171310]/15 bg-white/80 backdrop-blur-[2px]"
        style={{
          backgroundColor: `rgba(255, 255, 255, ${progress})`,
          borderBottomColor: `rgba(23, 19, 16, ${Math.max(progress, 0.25)})`,
        }}
      >
        <div className="page-wrap flex items-center justify-between gap-4 py-4 sm:py-5">
          <Link
            className="font-display text-2xl leading-none uppercase text-ink sm:text-3xl"
            to="/"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {brand}
          </Link>

          <nav className="hidden min-[900px]:flex items-center gap-8">
            <Link
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              to="/#how"
              onClick={(event) => handleSectionClick(event as never, "how")}
            >
              How it works
            </Link>
            <Link
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              to="/wallet"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Wallet
            </Link>
            <Link
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              to="/my-tickets"
              onClick={(event) => {
                event.preventDefault();
                handleProtectedNavigation("/my-tickets");
              }}
            >
              My Tickets
            </Link>

            <Link
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              to="/winners"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Winners
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <button
                type="button"
                className="flex w-auto max-w-[clamp(130px,19vw,220px)] items-center gap-2 rounded-full border-[3px] border-ink bg-[#ececec] px-2 py-1.5 text-left shadow-[3px_3px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5 sm:gap-3 sm:px-4 sm:py-2"
                onClick={() => navigate("/user/profile")}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={accountLabel}
                    className="h-8 w-8 shrink-0 rounded-full border-[2px] border-white/80 bg-[#fff3f8] object-cover shadow-[0_0_0_2px_rgba(255,255,255,0.9)] sm:h-9 sm:w-9"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-[2px] border-white/80 bg-[#1d1d1d] text-[0.65rem] font-black uppercase text-white shadow-[0_0_0_2px_rgba(255,255,255,0.9)] sm:h-9 sm:w-9 sm:text-xs">
                    {accountInitial}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-[0.7rem] font-black uppercase text-ink sm:text-base">
                  {accountLabel}
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border-[3px] border-ink bg-[#ff3d8c] px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#171310] transition-all duration-200 hover:-translate-y-1 hover:shadow-[7px_7px_0_#171310] active:translate-y-0 active:shadow-[3px_3px_0_#171310] sm:px-5 sm:py-2.5 sm:text-sm sm:tracking-[0.12em]"
                onClick={() => openAuthModal()}
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.5),_transparent_35%)]" />
                <span className="absolute inset-y-0 left-[-35%] w-[38%] -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80 blur-[1px] animate-[shine_3s_ease-in-out_infinite]" />
                <span className="relative z-10 whitespace-nowrap">
                  {actionLabel || "Login / Signup"}
                </span>
              </button>
            )}

            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-ink bg-[#f5f1ee] shadow-[3px_3px_0_#171310] transition-all duration-200 hover:-translate-y-0.5 min-[900px]:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5 text-ink transition-transform duration-300 ease-out"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.3"
                  strokeLinejoin="round"
                  className="transition-all duration-300 ease-out"
                >
                  <path
                    d={
                      isMobileNavOpen
                        ? "M5 7L19 17M19 7L5 17"
                        : "M4 7H20M4 12H20M4 17H20"
                    }
                  />
                </g>
              </svg>
            </button>
          </div>
        </div>

        <div
          className={`absolute inset-x-0 top-full z-40 overflow-hidden transition-all duration-300 ease-out min-[900px]:hidden ${
            isMobileNavOpen
              ? "pointer-events-auto max-h-80 opacity-100 visible"
              : "pointer-events-none max-h-0 opacity-0 invisible"
          }`}
        >
          <div className="border-t-[2px] border-ink/10 bg-white/95 px-4 pb-4 pt-3 shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur-sm">
            <nav className="flex flex-col gap-2">
              <Link
                className="rounded-full border border-ink/15 bg-transparent px-3 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-[#fff2f6] active:translate-y-0 active:scale-[0.98]"
                to="/#how"
                onClick={(event) => {
                  event.preventDefault();
                  setIsMobileNavOpen(false);
                  handleSectionClick(event as never, "how");
                }}
              >
                How it works
              </Link>
              <Link
                className="rounded-full border border-ink/15 bg-transparent px-3 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-[#fff2f6] active:translate-y-0 active:scale-[0.98]"
                to="/wallet"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Wallet
              </Link>
              <Link
                className="rounded-full border border-ink/15 bg-transparent px-3 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-[#fff2f6] active:translate-y-0 active:scale-[0.98]"
                to="/my-tickets"
                onClick={(event) => {
                  event.preventDefault();
                  setIsMobileNavOpen(false);
                  handleProtectedNavigation("/my-tickets");
                }}
              >
                My Tickets
              </Link>
              <Link
                className="rounded-full border border-ink/15 bg-transparent px-3 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-[#fff2f6] active:translate-y-0 active:scale-[0.98]"
                to="/winners"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Winners
              </Link>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}

export default SiteHeader;
