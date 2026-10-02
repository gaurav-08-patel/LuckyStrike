import type { ReactNode } from "react";
import { useState } from "react";
import Footer from "./Footer";
import SiteHeader from "./SiteHeader";

type AccountLayoutProps = {
  title: string;
  subtitle?: string;
  sidebar?: ReactNode;
  children: ReactNode;
};

function AccountLayout({
  title,
  subtitle = "My account",
  sidebar,
  children,
}: AccountLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-[#f3f0ee] text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
      />

      <div className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-4 sm:px-6 lg:px-8 lg:py-6">
        {sidebar && (
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-[12px] border-[3px] border-ink bg-[#f8d95b] px-4 py-2 font-black uppercase tracking-[0.08em] text-ink shadow-[3px_3px_0_#171310]"
            >
              Menu
            </button>

            <div className="rounded-full border-[3px] border-ink bg-[#fffaf7] px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-ink shadow-[2px_2px_0_#171310]">
              {title}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-5 lg:mt-6">
          {sidebar && (
            <>
              <aside className="hidden w-[260px] shrink-0 rounded-[24px] border-[3px] border-ink bg-[#fffaf7] p-3 shadow-[6px_6px_0_#171310] lg:block">
                <div className="mb-4 px-2 pt-2">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-ink/60">
                    {subtitle}
                  </p>
                  <h1 className="mt-2 font-display text-[2rem] uppercase leading-none tracking-[-0.05em] text-ink">
                    {title}
                  </h1>
                </div>

                {sidebar}
              </aside>

              {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-[#171310]/55 backdrop-blur-[2px] lg:hidden">
                  <div className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] border-r-[3px] border-ink bg-[#fffaf7] p-4 shadow-[8px_0_0_#171310]">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-ink/60">
                          {subtitle}
                        </p>
                        <h2 className="mt-2 font-display text-[1.8rem] uppercase leading-none tracking-[-0.05em] text-ink">
                          {title}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-ink bg-white text-xl font-black text-ink"
                      >
                        ×
                      </button>
                    </div>

                    <div onClick={() => setSidebarOpen(false)}>{sidebar}</div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="min-h-[500px] flex-1">{children}</div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default AccountLayout;
