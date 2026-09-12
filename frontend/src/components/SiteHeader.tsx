import { useEffect, useState } from "react";
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
  const [cartCount, setCartCount] = useState(4);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const accountLabel = user?.firstName ? user.firstName : "Account";

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <header
        className="sticky top-0 z-50 border-b-4 border-b-transparent"
        style={{
          backgroundColor: `rgba(255, 255, 255, ${progress})`,
          borderBottomColor: `rgba(23, 19, 16, ${progress})`,
        }}
      >
        <div className="page-wrap flex items-center justify-between gap-4 py-4 sm:py-5">
          <a
            className="font-display text-2xl leading-none uppercase text-ink sm:text-3xl"
            href="#hero"
          >
            {brand}
          </a>

          <nav className="hidden min-[900px]:flex items-center gap-8">
            <a
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              href="#how"
            >
              How it works
            </a>
            <a
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              href="#wallet"
            >
              Wallet
            </a>
            <a
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              href="#draw"
            >
              Prize line-up
            </a>
            <a
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              href="#winners"
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
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-[#f7f7f7] px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-ink shadow-[4px_4px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5"
                onClick={() => setIsAuthModalOpen(true)}
              >
                {actionLabel || "Login / Signup"}
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default SiteHeader;
