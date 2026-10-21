import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "received", label: "Received" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const statusClassMap: Record<string, string> = {
  received: "border-[3px] border-ink bg-[#fff3b6] text-ink",
  in_review: "border-[3px] border-ink bg-[#ffe5d7] text-ink",
  resolved: "border-[3px] border-ink bg-[#dff7e7] text-[#1b5d3f]",
  closed: "border-[3px] border-ink bg-[#f8dfe1] text-[#8b2d38]",
};

type SupportUser = {
  id: number;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

type SupportRequest = {
  id: number;
  userId: number;
  issueType: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  user: SupportUser;
};

function formatDateTime(value: string | null | undefined) {
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

function formatName(user: SupportUser) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || `User #${user.id}`;
}

export default function AdminSupportTab() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [statusDraft, setStatusDraft] = useState("received");
  const [errorMessage, setErrorMessage] = useState("");

  const loadRequests = async (nextPage = 1, append = false) => {
    const token = localStorage.getItem("luckyStrikeToken");

    if (!token) {
      setErrorMessage("Your session expired, please sign in again.");
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    try {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setErrorMessage("");

      const params = new URLSearchParams({
        status: statusFilter,
        page: String(nextPage),
        limit: "15",
        sort: "desc",
      });

      if (debouncedSearchTerm.trim()) {
        params.set("search", debouncedSearchTerm.trim());
      }

      const response = await fetch(`${API_BASE_URL}/api/support/admin/requests?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load support requests.");
      }

      const nextRequests = Array.isArray(data?.requests) ? data.requests : [];
      setRequests((previous) => (append ? [...previous, ...nextRequests] : nextRequests));
      setHasNextPage(Boolean(data?.hasNextPage));
      setTotal(Number(data?.total ?? nextRequests.length));
      setPage(nextPage);
    } catch (error) {
      setRequests([]);
      setHasNextPage(false);
      setTotal(0);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load support requests right now.",
      );
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
    void loadRequests(1, false);
  }, [statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    if (selectedRequest) {
      setStatusDraft(selectedRequest.status);
    }
  }, [selectedRequest]);

  const updateStatus = async () => {
    if (!selectedRequest) return;

    const token = localStorage.getItem("luckyStrikeToken");

    if (!token) {
      setErrorMessage("Your session expired, please sign in again.");
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/support/admin/requests/${selectedRequest.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: statusDraft }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to update support status.");
      }

      setRequests((previous) =>
        previous.map((request) =>
          request.id === selectedRequest.id
            ? { ...request, status: statusDraft, updatedAt: new Date().toISOString() }
            : request,
        ),
      );

      setSelectedRequest((previous) =>
        previous
          ? { ...previous, status: statusDraft, updatedAt: new Date().toISOString() }
          : previous,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update this support request.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border-[3px] border-ink bg-[#fff3f7] p-4 shadow-[6px_6px_0_#171310] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-pink sm:text-[10px]">
              Admin tools
            </p>
            <h2 className="mt-1 font-display text-[1.6rem] leading-none tracking-[-0.05em] text-ink sm:text-[2rem]">
              Support requests
            </h2>
          </div>
          <span className="rounded-full border-[3px] border-ink bg-yellow px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-ink sm:text-[10px]">
            {requests.length} shown / {total} total
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1.5fr_0.8fr]">
          <label className="block rounded-[16px] border-[3px] border-pink bg-[#fff7fa] p-3 shadow-[3px_3px_0_#171310]">
            <span className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.08em] text-pink sm:text-[10px]">
              <span className="text-sm sm:text-base">⌕</span>
              Search requests
            </span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by user, issue, or subject"
              className="w-full cursor-text border-0 bg-transparent p-0 text-[12px] font-medium text-ink placeholder:text-ink/40 focus:outline-none sm:text-sm"
            />
          </label>

          <label className="rounded-[14px] border-[3px] border-ink bg-[#fffdfb] p-2.5 shadow-[2px_2px_0_#171310]">
            <span className="mb-2 block text-[8px] font-black uppercase tracking-[0.08em] text-ink/70 sm:text-[10px]">
              Status filter
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full cursor-pointer border-0 bg-transparent p-0 text-[12px] font-medium text-ink focus:outline-none sm:text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-[14px] border-[3px] border-ink bg-[#ffe8e8] p-3 text-sm text-[#9a2f2f] shadow-[3px_3px_0_#171310]">
          {errorMessage}
        </div>
      ) : null}

      <section className="w-full rounded-[24px] border-[3px] border-ink bg-paper p-3 shadow-[6px_6px_0_#171310] sm:p-5">
        {isLoading ? (
          <div className="rounded-[14px] border-[3px] border-ink bg-warm p-4 text-sm text-ink/60">
            Loading support requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-[14px] border-[3px] border-ink bg-[#fff1f6] p-4 text-sm text-ink/60">
            {debouncedSearchTerm || statusFilter !== "all"
              ? "No support requests match your current filters."
              : "No support requests found."}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto pb-1">
              <table className="w-full min-w-[760px] table-fixed text-left text-[11px] sm:text-sm">
                <thead>
                  <tr className="border-b-[3px] border-ink text-[9px] font-bold uppercase tracking-[0.08em] text-ink/70 sm:text-[10px]">
                    <th className="w-[9%] px-2 py-2">Request</th>
                    <th className="w-[18%] px-2 py-2">User</th>
                    <th className="w-[14%] px-2 py-2">Issue</th>
                    <th className="w-[22%] px-2 py-2">Subject</th>
                    <th className="w-[12%] px-2 py-2">Status</th>
                    <th className="w-[16%] px-2 py-2">Created</th>
                    <th className="w-[9%] px-2 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request, index) => (
                    <tr
                      key={request.id}
                      className={index === requests.length - 1 ? "" : "border-b border-ink/20"}
                    >
                      <td className="px-2 py-2.5 font-bold text-ink break-words">#{request.id}</td>
                      <td className="px-2 py-2.5 text-ink break-words">
                        <div className="font-semibold">{formatName(request.user)}</div>
                        <div className="text-[9px] text-ink/60 sm:text-[11px]">
                          {request.user.email || "No email"}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-ink/80 break-words">{request.issueType}</td>
                      <td className="px-2 py-2.5 text-ink/80 break-words">{request.subject}</td>
                      <td className="px-2 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold sm:px-2 sm:py-0.5 sm:text-[10px] ${statusClassMap[request.status] ?? "border-[3px] border-ink bg-paper text-ink"}`}
                        >
                          {request.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-ink/70 break-words">{formatDateTime(request.createdAt)}</td>
                      <td className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(request)}
                          className="cursor-pointer rounded-full border-[3px] border-ink bg-yellow px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-ink shadow-[2px_2px_0_#171310] sm:text-[10px]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasNextPage ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadRequests(page + 1, true)}
                  disabled={isLoadingMore}
                  className="cursor-pointer rounded-full border-[3px] border-ink bg-pink px-4 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_#171310] disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
                >
                  {isLoadingMore ? "Loading more..." : "Show more"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {selectedRequest && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-3"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#ffe7ec] bg-gradient-to-br from-[#fffafc] to-[#fffdfb] shadow-[0_16px_40px_rgba(23,19,16,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#f1dfe7] bg-[#fff7f9] px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-pink-600/70">
                    Support request
                  </p>
                  <h3 className="mt-2 font-display text-[1.7rem] leading-none tracking-[-0.06em] text-ink sm:text-[2rem]">
                    #{selectedRequest.id}
                  </h3>
                  <p className="mt-2 text-[11px] text-ink/70 sm:text-xs">
                    Submitted on {formatDateTime(selectedRequest.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#f1dfe7] bg-white text-lg font-black text-ink shadow-sm transition hover:-translate-y-0.5"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="rounded-2xl border border-[#f1dfe7] bg-white/90 p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1dfe7] pb-3">
                  <div>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/55">
                      Subject
                    </p>
                    <p className="mt-1 font-display text-[1.2rem] leading-none tracking-[-0.03em] text-ink sm:text-[1.5rem]">
                      {selectedRequest.subject}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full border-[3px] border-ink px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] sm:text-[10px] ${statusClassMap[selectedRequest.status] ?? "bg-paper text-ink"}`}
                  >
                    {selectedRequest.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-2 sm:text-xs">
                  <div className="rounded-xl border border-[#f1dfe7] bg-[#fff9fb] p-3">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/55">
                      User
                    </p>
                    <p className="mt-2 font-semibold text-ink">{formatName(selectedRequest.user)}</p>
                    <p className="mt-1 text-ink/70">{selectedRequest.user.email || "No email"}</p>
                    <p className="mt-1 text-ink/70">{selectedRequest.user.phoneNumber || "No phone number"}</p>
                  </div>

                  <div className="rounded-xl border border-[#f1dfe7] bg-[#fffdf5] p-3">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/55">
                      Issue
                    </p>
                    <p className="mt-2 font-semibold text-ink">{selectedRequest.issueType}</p>
                    <p className="mt-1 text-ink/70">
                      Last update: {formatDateTime(selectedRequest.updatedAt || selectedRequest.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#f1dfe7] bg-[#fff8fd] p-3">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/55">
                    Request message
                  </p>
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#f1dfe7] bg-white p-3">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-ink/85">
                      {selectedRequest.message}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#f1dfe7] bg-[#fff7ea] p-3">
                  <label className="block">
                    <span className="mb-2 block text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/55">
                      Change status
                    </span>
                    <select
                      value={statusDraft}
                      onChange={(event) => setStatusDraft(event.target.value)}
                      className="h-[46px] w-full rounded-xl border border-[#e9dfe6] bg-white px-3 text-sm font-medium text-ink outline-none transition-colors duration-200 focus:border-pink-300"
                    >
                      {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => void updateStatus()}
                    disabled={isUpdating}
                    className="mt-3 cursor-pointer rounded-md bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.12em] text-white shadow-sm transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdating ? "Updating..." : "Save status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
