import { useEffect, useState } from "react";

type HeaderLink = {
  label: string;
  href: string;
};

type SiteHeaderProps = {
  brand: React.ReactNode;
  links: HeaderLink[];
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

function SiteHeader({
  brand,
  links,
  actionLabel,
  actionHref = "#hero",
}: SiteHeaderProps) {
  const progress = useScrollProgress(120);

  return (
    <header
      className="sticky top-0 z-50 border-b-[3px] border-b-transparent"
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
          {links.map((link) => (
            <a
              key={link.label}
              className="text-sm font-bold text-ink transition-colors duration-150 hover:text-pink"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {actionLabel ? (
          <a
            className="ticket-button ticket-button--yellow ticket-button--nav text-sm"
            href={actionHref}
          >
            {actionLabel}
          </a>
        ) : null}
      </div>
    </header>
  );
}

export default SiteHeader;
