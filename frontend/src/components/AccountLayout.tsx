import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "./Footer";
import SiteHeader from "./SiteHeader";
import { FiLogOut } from "react-icons/fi";

type AccountLayoutProps = {
  title: string;
  subtitle?: string;
  sidebar?: ReactNode;
  children: ReactNode;
};

function AccountLayout({
  subtitle = "My account",
  sidebar,
  children,
}: AccountLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Lucky User";
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";
  const email = user?.email || "No email provided";
  const roleLabel = user?.isAdmin ? "Admin account" : "User account";
  const avatarUrl = user?.profileImage ?? null;
  const roleBadgeClasses = user?.isAdmin
    ? "border-violet-700 bg-[linear-gradient(135deg,#f3e8ff_0%,#ede9fe_45%,#f5f3ff_100%)] text-violet-900 shadow-[2px_2px_0_#7c3aed]"
    : "border-emerald-700 bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_45%,#f0fdf4_100%)] text-emerald-900 shadow-[2px_2px_0_#059669]";

  const profileCard = (
    <div className="mb-5 rounded-[18px] border-[3px] border-ink bg-[linear-gradient(135deg,#fffaf5_0%,#f5efe9_45%,#fdf2f8_100%)] p-3 shadow-[4px_4px_0_#171310]">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="h-12 w-12 shrink-0 rounded-full border-[2px] border-white/80 bg-[#fff3f8] object-cover shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-[2px] border-white/80 bg-[#1a1a1a] text-sm font-black uppercase text-white shadow-[0_0_0_2px_rgba(255,255,255,0.9)]">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl uppercase leading-none tracking-[-0.04em] text-ink">
            {fullName}
          </p>
          <p className="mt-1 truncate text-[0.68rem] text-ink/70">{email}</p>
        </div>
      </div>

      <div
        className={`mt-3 inline-flex items-center gap-1.5 rounded-full border-[2px] px-2 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] ${roleBadgeClasses}`}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
        {roleLabel}
      </div>
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col bg-[#f3f0ee] text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
      />

      <div className="mx-auto min-h-screen w-full max-w-[1400px] flex-1 px-3 py-4 sm:px-6 lg:px-8 lg:py-6 relative">
        {sidebar && (
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              aria-label="Open account menu"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-[#f8d95b] px-3 py-2 text-[0.62rem] font-black uppercase tracking-[0.08em] text-ink shadow-[3px_3px_0_#171310] transition-all duration-200 hover:-translate-y-0.5"
            >
              Menu
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 ease-out"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                >
                  <path d="M4 7H20M4 12H20M4 17H20" />
                </g>
              </svg>
            </button>
          </div>
        )}

        <div className="mt-4 flex gap-5 lg:mt-6">
          {sidebar && (
            <>
              <aside className="hidden w-[260px] shrink-0 rounded-[24px] border-[3px] border-ink bg-[#fffaf7] p-3 shadow-[6px_6px_0_#171310] lg:flex lg:flex-col">
                <div className="mb-4 px-2 pt-2">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-ink/60">
                    {subtitle}
                  </p>
                </div>

                {profileCard}

                <div className="flex-1 overflow-auto pt-2">{sidebar}</div>

                {user && (
                  <div className="mt-auto lg:mt-6 px-2 pb-3">
                    <button
                      type="button"
                      onClick={() => setLogoutConfirmOpen(true)}
                      className="flex w-full items-center justify-center gap-3 rounded-[14px] border-2 border-[#d83b45] bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-3 py-2 text-white font-black uppercase tracking-[0.06em] shadow-[3px_3px_0_#7a1a1f]"
                    >
                      <FiLogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </aside>

              <div
                className={`fixed inset-0 z-[60] overflow-hidden bg-[#171310]/55 backdrop-blur-[2px] transition-all duration-300 ease-out lg:hidden ${
                  sidebarOpen
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div
                  className={`relative z-[70] h-full w-[82%] max-w-[320px] border-r-[3px] border-ink bg-[#fffaf7] p-4 shadow-[8px_0_0_#171310] transition-transform duration-300 ease-out ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                  }`}
                  style={{
                    paddingBottom:
                      "calc(env(safe-area-inset-bottom, 16px) + 1rem)",
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-ink/60">
                        {subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSidebarOpen(false)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-ink bg-white text-xl font-black text-ink"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex h-full flex-col">
                    {profileCard}

                    <div
                      className="flex-1 overflow-auto"
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        paddingBottom:
                          "calc(72px + env(safe-area-inset-bottom, 16px))",
                      }}
                    >
                      {sidebar}
                    </div>

                    {user && (
                      <div className="mt-auto px-1 pb-4">
                        <button
                          type="button"
                          onClick={() => setLogoutConfirmOpen(true)}
                          className="flex w-full items-center justify-center gap-3 rounded-[12px] border-2 border-[#d83b45] bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-3 py-2 text-white font-black uppercase tracking-[0.06em] shadow-[3px_3px_0_#7a1a1f]"
                        >
                          <FiLogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    )}

                    {user && (
                      <div
                        className="absolute left-0 right-0 bottom-0 px-4"
                        style={{ bottom: "env(safe-area-inset-bottom, 16px)" }}
                      >
                        <div className="mx-0 w-full">
                          <button
                            type="button"
                            onClick={() => setLogoutConfirmOpen(true)}
                            className="w-full rounded-[12px] border-2 border-[#d83b45] bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-3 py-3 text-white font-black uppercase tracking-[0.06em] shadow-[3px_3px_0_#7a1a1f]"
                          >
                            <div className="flex items-center justify-center gap-3">
                              <FiLogOut className="h-4 w-4" />
                              Logout
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="min-h-[500px] flex-1">{children}</div>
        </div>
      </div>

      {/* Logout confirmation modal */}
      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <div
            className={`w-[92%] max-w-md rounded-xl bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.25)] transform transition-all duration-300 ease-out ${
              logoutConfirmOpen
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-4 scale-95"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-black text-ink">Confirm logout</h3>
            <p className="mb-5 text-sm text-ink/80">
              Are you sure you want to log out?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-bold text-ink/80"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    logoutUser();
                  } catch {}
                  setLogoutConfirmOpen(false);
                  navigate("/");
                }}
                className="rounded-md bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-4 py-2 text-sm font-black text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

export default AccountLayout;
