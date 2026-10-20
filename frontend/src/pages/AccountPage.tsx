import { Navigate, useNavigate, useParams } from "react-router-dom";
import AccountLayout from "../components/AccountLayout";
import ActivityTab from "../components/ActivityTab";
import ProfileTab from "../components/ProfileTab";
import SupportTab from "../components/SupportTab";
import { useAuth } from "../context/AuthContext";

type AccountPageProps = {
  role: "user" | "admin";
};

function AccountPage({ role }: AccountPageProps) {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isActualAdmin = Boolean(user?.isAdmin);
  const effectiveRole =
    role === "admin" ? (isActualAdmin ? "admin" : "user") : "user";
  const allowedRole = role === "admin" ? "admin" : "user";

  const userTabs = [
    { key: "profile", label: "Profile", link: "/user/profile" },
    { key: "tickets", label: "Tickets", link: "/my-tickets" },
    { key: "activity", label: "Activity", link: "/user/activity" },
    { key: "support", label: "Support", link: "/user/support" },
  ];

  const adminTabs = [
    { key: "overview", label: "Overview", link: "/admin/overview" },
    { key: "draws", label: "Draws", link: "/admin/draws" },
    { key: "users", label: "Users", link: "/admin/users" },
    { key: "payments", label: "Payments", link: "/admin/payments" },
    { key: "settings", label: "Settings", link: "/admin/settings" },
  ];

  const tabs = effectiveRole === "admin" ? adminTabs : userTabs;
  const fallbackTab = tabs[0].key;
  const isKnownTab = Boolean(tab && tabs.some((item) => item.key === tab));

  if (allowedRole === "admin" && !isActualAdmin) {
    return <Navigate to="/user/profile" replace />;
  }

  if (tab && !isKnownTab) {
    return (
      <Navigate
        to={role === "admin" ? "/admin/overview" : "/user/profile"}
        replace
      />
    );
  }

  const currentTab = tab ?? fallbackTab;

  const sidebar = (
    <nav className="space-y-2">
      {tabs.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => navigate(item.link)}
          className={`flex w-full items-center justify-between rounded-[14px] border-[3px] px-3 py-3 text-left text-sm font-black uppercase tracking-[0.08em] transition-all ${
            currentTab === item.key
              ? "border-ink bg-[#ff3d8c] text-white shadow-[3px_3px_0_#171310]"
              : "border-ink bg-white text-ink shadow-[2px_2px_0_#d7d2cf]"
          }`}
        >
          <span>{item.label}</span>
          <span>{">"}</span>
        </button>
      ))}
    </nav>
  );

  const renderTabContent = () => {
    if (effectiveRole === "admin") {
      switch (currentTab) {
        case "overview":
          return (
            <div className="rounded-[24px] border-[3px] border-ink bg-[#fffaf7] p-6 shadow-[5px_5px_0_#171310]">
              <h2 className="font-display text-[2rem] uppercase leading-none tracking-[-0.05em] text-ink">
                Overview
              </h2>
              <p className="mt-3 text-sm text-ink/70">
                Admin dashboard summary and key metrics live here.
              </p>
            </div>
          );
        case "draws":
          return (
            <div className="rounded-[24px] border-[3px] border-ink bg-[#f4f6ff] p-6 shadow-[5px_5px_0_#171310]">
              <h2 className="font-display text-[2rem] uppercase leading-none tracking-[-0.05em] text-ink">
                Draws
              </h2>
              <p className="mt-3 text-sm text-ink/70">
                Manage campaign schedules, prize pools, and draw states here.
              </p>
            </div>
          );
        case "users":
          return (
            <div className="rounded-[24px] border-[3px] border-ink bg-[#f0fff5] p-6 shadow-[5px_5px_0_#171310]">
              <h2 className="font-display text-[2rem] uppercase leading-none tracking-[-0.05em] text-ink">
                Users
              </h2>
              <p className="mt-3 text-sm text-ink/70">
                Review accounts, permissions, and user-level activity.
              </p>
            </div>
          );
        case "payments":
          return (
            <div className="rounded-[24px] border-[3px] border-ink bg-[#fff7dc] p-6 shadow-[5px_5px_0_#171310]">
              <h2 className="font-display text-[2rem] uppercase leading-none tracking-[-0.05em] text-ink">
                Payments
              </h2>
              <p className="mt-3 text-sm text-ink/70">
                Track wallet transactions, settlements, and payout activity.
              </p>
            </div>
          );
        case "settings":
          return (
            <div className="rounded-[24px] border-[3px] border-ink bg-[#fff0f3] p-6 shadow-[5px_5px_0_#171310]">
              <h2 className="font-display text-[2rem] uppercase leading-none tracking-[-0.05em] text-ink">
                Settings
              </h2>
              <p className="mt-3 text-sm text-ink/70">
                Configure store preferences, permissions, and operational
                defaults.
              </p>
            </div>
          );
        default:
          return null;
      }
    }

    switch (currentTab) {
      case "profile":
        return <ProfileTab />;
      case "activity":
        return <ActivityTab />;
      case "support":
        return <SupportTab />;
      default:
        return null;
    }
  };

  return (
    <AccountLayout
      title={effectiveRole === "admin" ? "Admin" : "User"}
      subtitle={effectiveRole === "admin" ? "Admin account" : "My account"}
      sidebar={sidebar}
    >
      {renderTabContent()}
    </AccountLayout>
  );
}

export default AccountPage;
