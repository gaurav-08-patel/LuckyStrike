import { useEffect, useRef, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type UserRecord = {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  gender: string;
  nationality: string;
  countryOfResidence: string;
  walletBalance: number;
  isPhoneVerified: boolean;
  isAdmin: boolean;
  createdAt: string | Date | null;
};

function formatDateTime(value: string | Date | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getRoleBadgeClass(isAdmin: boolean) {
  return isAdmin
    ? "border-[3px] border-ink bg-[#ff3d8c] text-white"
    : "border-[3px] border-ink bg-yellow text-ink";
}

function getVerificationBadgeClass(isVerified: boolean) {
  return isVerified
    ? "border-[3px] border-ink bg-[#dff6e7] text-[#1f6d42]"
    : "border-[3px] border-ink bg-[#ffe8e8] text-[#9a2f2f]";
}

export default function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [hasMore, setHasMore] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const initialLoadRef = useRef(true);

  const loadUsers = async (append = false) => {
    const token = localStorage.getItem("luckyStrikeToken");

    if (!token) {
      setErrorMessage("Your session has expired. Please sign in again.");
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage("");

      const params = new URLSearchParams({
        limit: "15",
        offset: String(append ? users.length : 0),
        search: searchTerm.trim(),
        role: roleFilter,
        verification: verificationFilter,
        sortOrder: "desc",
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load users.");
      }

      const nextUsers = Array.isArray(data?.users) ? data.users : [];
      setUsers((previous) => (append ? [...previous, ...nextUsers] : nextUsers));
      setHasMore(Boolean(data?.hasMore));
      setTotalUsers(Number(data?.total ?? nextUsers.length));
    } catch {
      setUsers([]);
      setHasMore(false);
      setTotalUsers(0);
      setErrorMessage("Unable to load users right now. Please try again in a moment.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      void loadUsers(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadUsers(false);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, roleFilter, verificationFilter]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-[18px] border-[3px] border-ink bg-[#fff4f7] p-3 shadow-[4px_4px_0_#171310] sm:rounded-[24px] sm:p-5 sm:shadow-[6px_6px_0_#171310]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-pink sm:text-[10px]">
              Admin tools
            </p>
            <h2 className="mt-1 font-display text-[1.5rem] leading-none tracking-[-0.05em] text-ink sm:text-[2rem]">
              Users
            </h2>
          </div>
          <span className="self-start rounded-full border-[3px] border-ink bg-yellow px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-ink sm:px-2.5 sm:py-1 sm:text-[10px]">
            {users.length} shown / {totalUsers} total
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-5 md:grid-cols-[1.5fr_0.8fr_0.8fr]">
          <label className="block rounded-[14px] border-[3px] border-pink bg-[#fff7fa] p-2.5 shadow-[2px_2px_0_#171310] sm:rounded-[18px] sm:p-3">
            <span className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.08em] text-pink sm:text-[10px]">
              <span className="text-sm sm:text-base">⌕</span>
              Search users
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, phone, or ID"
              className="w-full cursor-text border-0 bg-transparent p-0 text-[12px] font-medium text-ink placeholder:text-ink/40 focus:outline-none sm:text-sm"
            />
          </label>

          <label className="rounded-[12px] border-[3px] border-ink bg-[#fffdfb] p-2 shadow-[2px_2px_0_#171310] sm:rounded-[14px] sm:p-2.5">
            <span className="mb-2 block text-[8px] font-black uppercase tracking-[0.08em] text-ink/70 sm:text-[10px]">
              Role
            </span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="w-full cursor-pointer border-0 bg-transparent p-0 text-[12px] font-medium text-ink focus:outline-none sm:text-sm"
            >
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </label>

          <label className="rounded-[12px] border-[3px] border-ink bg-[#fffdfb] p-2 shadow-[2px_2px_0_#171310] sm:rounded-[14px] sm:p-2.5">
            <span className="mb-2 block text-[8px] font-black uppercase tracking-[0.08em] text-ink/70 sm:text-[10px]">
              Verification
            </span>
            <select
              value={verificationFilter}
              onChange={(event) => setVerificationFilter(event.target.value)}
              className="w-full cursor-pointer border-0 bg-transparent p-0 text-[12px] font-medium text-ink focus:outline-none sm:text-sm"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </label>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-[12px] border-[3px] border-ink bg-[#ffe8e8] p-2.5 text-[12px] text-[#9a2f2f] shadow-[3px_3px_0_#171310] sm:rounded-[14px] sm:p-3 sm:text-sm">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded-[18px] border-[3px] border-ink bg-paper p-3 shadow-[4px_4px_0_#171310] sm:rounded-[24px] sm:p-5 sm:shadow-[6px_6px_0_#171310]">
        {isLoading ? (
          <div className="rounded-[12px] border-[3px] border-ink bg-warm p-3 text-[12px] text-ink/60 sm:rounded-[14px] sm:p-4 sm:text-sm">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-[12px] border-[3px] border-ink bg-[#fff1f6] p-3 text-[12px] text-ink/60 sm:rounded-[14px] sm:p-4 sm:text-sm">
            {searchTerm.trim() || roleFilter !== "all" || verificationFilter !== "all"
              ? "No users match your current filters."
              : "No users found."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto pb-1">
              <table className="min-w-[620px] text-left text-[11px] sm:min-w-[720px] sm:text-sm">
                <thead>
                  <tr className="border-b-[3px] border-ink text-[9px] font-bold uppercase tracking-[0.08em] text-ink/70 sm:text-[10px]">
                    <th className="px-2 py-2">User</th>
                    <th className="px-2 py-2">Phone</th>
                    <th className="px-2 py-2">Email</th>
                    <th className="px-2 py-2">Role</th>
                    <th className="px-2 py-2">Verified</th>
                    <th className="px-2 py-2">Wallet</th>
                    <th className="w-[150px] px-2 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={index === users.length - 1 ? "" : "border-b border-ink/20"}
                    >
                      <td className="px-2 py-2.5 text-ink align-top">
                        <div className="font-semibold">{user.fullName}</div>
                        <div className="text-[9px] text-ink/60 sm:text-[11px]">ID: #{user.id}</div>
                      </td>
                      <td className="px-2 py-2.5 text-ink/80 align-top">{user.phoneNumber || "-"}</td>
                      <td className="px-2 py-2.5 text-ink/80 align-top">{user.email || "-"}</td>
                      <td className="px-2 py-2.5 align-top">
                        <span
                          className={`inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold sm:px-2 sm:py-0.5 sm:text-[10px] ${getRoleBadgeClass(user.isAdmin)}`}
                        >
                          {user.isAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 align-top">
                        <span
                          className={`inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold sm:px-2 sm:py-0.5 sm:text-[10px] ${getVerificationBadgeClass(user.isPhoneVerified)}`}
                        >
                          {user.isPhoneVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-ink/80 align-top">{formatCurrency(user.walletBalance)}</td>
                      <td className="w-[150px] px-2 py-2.5 text-ink/70 align-top">{formatDateTime(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadUsers(true)}
                  disabled={isLoadingMore}
                  className="cursor-pointer rounded-full border-[3px] border-ink bg-pink px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_#171310] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs"
                >
                  {isLoadingMore ? "Loading more..." : "Show more"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
