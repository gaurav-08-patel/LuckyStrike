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
  const { isLoggedIn, user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(4);
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
              href="/#wallet"
              onClick={(event) => handleSectionClick(event, "wallet")}
            >
              Wallet
            </a>
            <a
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              href="/#draw"
              onClick={(event) => handleSectionClick(event, "draw")}
            >
              Prize line-up
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

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-full border-[3px] border-ink bg-[#ececec] px-4 py-2 text-left shadow-[3px_3px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5"
                  onClick={logoutUser}
                >
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-[3px] border-ink bg-[#1d1d1d] text-xs font-black uppercase text-white">
                    A
                  </span>
                  <span className="text-base font-black uppercase text-ink">
                    {accountLabel}
                  </span>
                </button>

                <button
                  type="button"
                  className="relative flex items-center justify-center rounded-[22px] border-[3px] border-ink bg-red px-3 py-2 shadow-[4px_4px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5"
                  aria-label="Cart"
                  onClick={() =>
                    setCartCount((current) => (current > 0 ? current - 1 : 0))
                  }
                >
                  <span className="text-lg font-black text-white">🛒</span>
                  {cartCount > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-ink bg-[#f7f7f7] text-[0.8rem] font-black text-ink">
                      {cartCount}
                    </span>
                  ) : null}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="relative flex items-center justify-center rounded-[22px] border-[3px] border-ink bg-red px-3 py-2 shadow-[4px_4px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5"
                  aria-label="Cart"
                  onClick={openAuthModal}
                >
                  <span className="text-lg font-black text-white">🛒</span>
                  {cartCount > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-ink bg-[#f7f7f7] text-[0.8rem] font-black text-ink">
                      {cartCount}
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border-[3px] border-ink bg-[#ff3d8c] px-5 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[5px_5px_0_#171310] transition-all duration-200 hover:-translate-y-1 hover:shadow-[7px_7px_0_#171310] active:translate-y-0 active:shadow-[3px_3px_0_#171310]"
                  onClick={openAuthModal}
                >
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.5),_transparent_35%)]" />
                  <span className="absolute inset-y-0 left-[-35%] w-[38%] -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80 blur-[1px] animate-[shine_3s_ease-in-out_infinite]" />
                  <span className="relative z-10">
                    {actionLabel || "Login / Signup"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default SiteHeader;
