import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const statusClassMap: Record<string, string> = {
  pending: "border border-[#f5c84c] bg-[#fff4bf] text-[#7a5300]",
  under_review: "border border-[#ffb870] bg-[#fff1df] text-[#8b4a00]",
  approved: "border border-[#3ecf8e] bg-[#dafae9] text-[#0f7b52]",
  rejected: "border border-[#f2527d] bg-[#ffe0ea] text-[#9a1844]",
  paid: "border border-[#36b37e] bg-[#d9f9ec] text-[#0b6d4c]",
  cancelled: "border border-[#9aa0a6] bg-[#eef1f4] text-[#4b5563]",
};

type AdminUser = {
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

type WithdrawalBank = {
  accountHolderName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  iban: string | null;
  ifscCode: string | null;
  swiftCode: string | null;
  branchName: string | null;
  routingNumber: string | null;
};

type WithdrawalRequest = {
  id: number;
  userId: number;
  bankAccountId: number;
  amount: number;
  currency: string;
  status: string;
  requestNote: string | null;
  adminNote: string | null;
  rejectionReason: string | null;
  paymentReference: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  user: AdminUser;
  bankAccount: WithdrawalBank;
};

type WithdrawalAuditLog = {
  id: number;
  withdrawal_request_id: number;
  actor_user_id: number | null;
  actor_role: string | null;
  action: string | null;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string | null;
  actorName?: string | null;
  actorLabel?: string | null;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatName(user: AdminUser) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || `User #${user.phoneNumber || "unknown"}`;
}

export default function AdminWithdrawalsTab() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [selectedRequestAuditLogs, setSelectedRequestAuditLogs] = useState<WithdrawalAuditLog[]>([]);
  const [rejectionReasonDraft, setRejectionReasonDraft] = useState("");

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
      });

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/withdrawals?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load withdrawal requests.");
      }

      const nextRequests = Array.isArray(data?.requests) ? data.requests : [];
      setRequests((previous) => (append ? [...previous, ...nextRequests] : nextRequests));
      setPage(nextPage);
      setHasNextPage(Boolean(data?.hasNextPage));
      setTotal(Number(data?.total ?? nextRequests.length));
    } catch (error) {
      setRequests([]);
      setHasNextPage(false);
      setTotal(0);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load withdrawal requests right now.",
      );
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setPage(1);
      void loadRequests(1, false);
      return;
    }

    setIsSearchDebouncing(true);
    const timer = window.setTimeout(() => {
      setPage(1);
      setIsSearchDebouncing(false);
      void loadRequests(1, false);
    }, 400);

    return () => {
      window.clearTimeout(timer);
      setIsSearchDebouncing(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (selectedRequest) {
      setRejectionReasonDraft(selectedRequest.rejectionReason || "Rejected by admin after review.");
    } else {
      setRejectionReasonDraft("");
    }
  }, [selectedRequest]);

  const openRequestDetails = async (request: WithdrawalRequest) => {
    const token = localStorage.getItem("luckyStrikeToken");

    if (!token) {
      setErrorMessage("Your session expired, please sign in again.");
      return;
    }

    setSelectedRequest(request);
    setSelectedRequestAuditLogs([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/withdrawals/${request.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to load withdrawal details.");
      }

      setSelectedRequest(data?.request || request);
      setSelectedRequestAuditLogs(Array.isArray(data?.auditLogs) ? data.auditLogs : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load withdrawal details.",
      );
    }
  };

  const updateRequestStatus = async (
    requestId: number,
    action: "approve" | "reject" | "pay",
    customReason?: string,
  ) => {
    const token = localStorage.getItem("luckyStrikeToken");
    if (!token) {
      setErrorMessage("Your session expired, please sign in again.");
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage("");

      const payload: Record<string, string> = {
        adminNote: action === "reject" ? "Withdrawal rejected by admin." : "Reviewed by admin.",
      };

      if (action === "reject") {
        payload.rejectionReason = customReason?.trim() || "Rejected by admin after review.";
      }

      if (action === "pay") {
        payload.paymentReference = `PAY-${requestId}-${Date.now()}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/withdrawals/${requestId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to update withdrawal status.");
      }

      setRequests((previous) =>
        previous.map((request) =>
          request.id === requestId ? { ...request, status: data?.status || request.status } : request,
        ),
      );

      setSelectedRequest((previous) =>
        previous && previous.id === requestId ? { ...previous, status: data?.status || previous.status } : previous,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update this withdrawal request.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectClick = (request: WithdrawalRequest) => {
    const trimmedReason = rejectionReasonDraft.trim();

    if (!trimmedReason) {
      setErrorMessage("Rejection reason is required before rejecting this request.");
      return;
    }

    void updateRequestStatus(request.id, "reject", trimmedReason);
  };

  const getActionButtons = (request: WithdrawalRequest) => {
    if (request.status === "paid" || request.status === "rejected" || request.status === "cancelled") {
      return null;
    }

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {request.status === "pending" || request.status === "under_review" ? (
          <button
            type="button"
            onClick={() => void updateRequestStatus(request.id, "approve")}
            disabled={isUpdating}
            className="rounded-full border-[3px] border-ink bg-[#dff7e7] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#1b5d3f] shadow-[2px_2px_0_#171310] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Approve
          </button>
        ) : null}

        {request.status === "approved" ? (
          <button
            type="button"
            onClick={() => void updateRequestStatus(request.id, "pay")}
            disabled={isUpdating}
            className="rounded-full border-[3px] border-ink bg-[#dfe9ff] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#1d4ed8] shadow-[2px_2px_0_#171310] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark paid
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => handleRejectClick(request)}
          disabled={isUpdating || !rejectionReasonDraft.trim()}
          className="rounded-full border-[3px] border-ink bg-[#f8dfe1] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#8b2d38] shadow-[2px_2px_0_#171310] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#ffe7ec] bg-gradient-to-br from-[#fff7f8] to-[#fffdfa] p-6 shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-pink-600 sm:text-[10px]">
              Admin tools
            </p>
            <h2 className="mt-1 font-display text-[1.8rem] leading-none tracking-[-0.05em] text-pink-600 sm:text-[2.5rem]">
              Withdrawal requests
            </h2>
          </div>
          <span className="rounded-full border border-pink-200 bg-pink-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-pink-700 sm:text-[10px]">
            {requests.length} shown / {total} total
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.5fr]">
          <label className="block w-full rounded-md border border-pink-200 bg-white p-3 shadow-sm">
            <span className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.08em] text-pink-600 sm:text-[10px]">
              <span className="text-sm sm:text-base">▾</span>
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

          <label className="block w-full rounded-md border border-pink-200 bg-white p-3 shadow-sm">
            <span className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.08em] text-pink-600 sm:text-[10px]">
              <span className="text-sm sm:text-base">⌕</span>
              Search withdrawal
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ID, user, phone, email, bank, IFSC"
              className="w-full border-0 bg-transparent p-0 text-[12px] font-medium text-ink placeholder:text-ink/40 focus:outline-none sm:text-sm"
            />
            {isSearchDebouncing ? (
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-pink-600">
                Searching...
              </div>
            ) : null}
          </label>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-[14px] border-[3px] border-ink bg-[#ffe8e8] p-3 text-sm text-[#9a2f2f] shadow-[3px_3px_0_#171310]">
          {errorMessage}
        </div>
      ) : null}

      <section className="w-full rounded-lg border border-[#ffe7ec] bg-white p-3 shadow-sm sm:p-5">
        {isLoading ? (
          <div className="rounded-[14px] border-[3px] border-ink bg-warm p-4 text-sm text-ink/60">
            Loading withdrawal requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-[14px] border-[3px] border-ink bg-[#fff1f6] p-4 text-sm text-ink/60">
            No withdrawal requests match the current filter.
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto pb-1">
              <table className="w-full min-w-[900px] table-fixed text-left text-[11px] sm:text-sm">
                <thead>
                  <tr className="border-b-[3px] border-ink text-[9px] font-bold uppercase tracking-[0.08em] text-ink/70 sm:text-[10px]">
                    <th className="w-[8%] px-2 py-2">ID</th>
                    <th className="w-[18%] px-2 py-2">User</th>
                    <th className="w-[15%] px-2 py-2">Amount</th>
                    <th className="w-[18%] px-2 py-2">Bank</th>
                    <th className="w-[11%] px-2 py-2">Status</th>
                    <th className="w-[16%] px-2 py-2">Created</th>
                    <th className="w-[14%] px-2 py-2 text-center">Action</th>
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
                      <td className="px-2 py-2.5 text-ink break-words">
                        <div className="font-black">₹{Number(request.amount).toFixed(2)}</div>
                        <div className="text-[9px] text-ink/60 sm:text-[11px]">{request.currency}</div>
                      </td>
                      <td className="px-2 py-2.5 text-ink/80 break-words">
                        <div className="font-semibold">{request.bankAccount.bankName || "-"}</div>
                        <div className="text-[9px] sm:text-[11px]">
                          {request.bankAccount.accountNumber || "-"}
                        </div>
                      </td>
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
                          onClick={() => void openRequestDetails(request)}
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

      {selectedRequest ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#171310]/45 p-3 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[24px] border border-[#ffe7ec] bg-gradient-to-br from-[#fff7f8] via-[#fffdfd] to-[#fff7f2] shadow-[0_24px_60px_rgba(23,19,16,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#ffe7ec] bg-[#fff5f8] px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-pink-600/70">
                    Withdrawal request
                  </p>
                  <h3 className="mt-2 font-display text-[1.7rem] leading-none tracking-[-0.06em] text-pink-600 sm:text-[2rem]">
                    #{selectedRequest.id}
                  </h3>
                  <p className="mt-2 text-[11px] text-ink/70 sm:text-xs">
                    Submitted on {formatDateTime(selectedRequest.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-pink-200 bg-white text-lg font-black text-pink-700 shadow-sm transition hover:-translate-y-0.5"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="rounded-[18px] border border-[#ffe7ec] bg-white p-4 shadow-[0_10px_22px_rgba(255,93,160,0.06)] sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ffe7ec] pb-3">
                  <div>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/55">
                      Amount
                    </p>
                    <p className="mt-1 font-display text-[1.2rem] leading-none tracking-[-0.03em] text-ink sm:text-[1.5rem]">
                      ₹{Number(selectedRequest.amount).toFixed(2)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full border-[3px] border-ink px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] sm:text-[10px] ${statusClassMap[selectedRequest.status] ?? "bg-paper text-ink"}`}
                  >
                    {selectedRequest.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-2 sm:text-xs">
                  <div className="rounded-md border border-[#ffe7ec] bg-[#fff9fb] p-3">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/55">
                      User
                    </p>
                    <p className="mt-2 font-semibold text-ink">{formatName(selectedRequest.user)}</p>
                    <p className="mt-1 text-ink/70">{selectedRequest.user.email || "No email"}</p>
                    <p className="mt-1 text-ink/70">{selectedRequest.user.phoneNumber || "No phone number"}</p>
                  </div>

                  <div className="rounded-md border border-[#e7f5eb] bg-[#f6fff9] p-3">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/55">
                     Bank details
                    </p>
                    <p className="mt-2 font-semibold text-ink">
                      {selectedRequest.bankAccount.bankName || "Unknown bank"}
                    </p>
                    <p className="mt-1 text-ink/70">
                      {selectedRequest.bankAccount.accountHolderName || "-"}
                    </p>
                    <p className="mt-1 text-ink/70">
                      {selectedRequest.bankAccount.accountNumber || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[16px] border border-[#ffe7ec] bg-[#fffafc] p-3 text-[11px] text-ink/75 sm:text-xs">
                  <p className="font-black uppercase tracking-[0.12em] text-pink-600">Full bank account details</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                   <div>
                     <p className="font-black uppercase tracking-[0.1em] text-ink/55">Account holder</p>
                     <p className="mt-1">{selectedRequest.bankAccount.accountHolderName || "-"}</p>
                   </div>
                   <div>
                     <p className="font-black uppercase tracking-[0.1em] text-ink/55">Bank name</p>
                     <p className="mt-1">{selectedRequest.bankAccount.bankName || "-"}</p>
                   </div>
                   <div>
                     <p className="font-black uppercase tracking-[0.1em] text-ink/55">Account number</p>
                     <p className="mt-1">{selectedRequest.bankAccount.accountNumber || "-"}</p>
                   </div>
                   <div>
                     <p className="font-black uppercase tracking-[0.1em] text-ink/55">Branch</p>
                     <p className="mt-1">{selectedRequest.bankAccount.branchName || "-"}</p>
                   </div>
                   <div>
                     <p className="font-black uppercase tracking-[0.1em] text-ink/55">IFSC code</p>
                     <p className="mt-1">{selectedRequest.bankAccount.ifscCode || "-"}</p>
                   </div>
                   <div>
                     <p className="font-black uppercase tracking-[0.1em] text-ink/55">SWIFT code</p>
                     <p className="mt-1">{selectedRequest.bankAccount.swiftCode || "-"}</p>
                   </div>
                   <div>
                     <p className="font-black uppercase tracking-[0.1em] text-ink/55">IBAN</p>
                     <p className="mt-1">{selectedRequest.bankAccount.iban || "-"}</p>
                   </div>
                   <div>
                     <p className="font-black uppercase tracking-[0.1em] text-ink/55">Routing number</p>
                     <p className="mt-1">{selectedRequest.bankAccount.routingNumber || "-"}</p>
                   </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-[11px] text-ink/75 sm:text-xs">
                  <div className="rounded-[14px] border border-[#ffe7ec] bg-[#fffafc] p-3">
                    <p className="font-black uppercase tracking-[0.12em] text-pink-600">Request note</p>
                    <p className="mt-2 whitespace-pre-wrap">
                      {selectedRequest.requestNote || "No request note was added."}
                    </p>
                  </div>

                  {selectedRequest.rejectionReason ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                      <p className="font-black uppercase tracking-[0.12em]">Rejection reason</p>
                      <p className="mt-2 whitespace-pre-wrap">{selectedRequest.rejectionReason}</p>
                    </div>
                  ) : null}

                  {selectedRequest.paymentReference ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-700">
                      <p className="font-black uppercase tracking-[0.12em]">Payment reference</p>
                      <p className="mt-2">{selectedRequest.paymentReference}</p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-[16px] border border-[#ffe7ec] bg-[#fffafc] p-3">
                  <p className="font-black uppercase tracking-[0.12em] text-pink-600">Audit trail</p>
                  {selectedRequestAuditLogs.length === 0 ? (
                    <p className="mt-2 text-[11px] text-ink/60 sm:text-xs">
                      No audit activity recorded for this request yet.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {selectedRequestAuditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-xl border border-[#ffe7ec] bg-white p-2.5 text-[11px] text-ink/75 sm:text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-black uppercase tracking-[0.08em] text-pink-600">
                              {log.action || "activity"}
                            </span>
                            <span className="text-[10px] text-ink/60">
                              {formatDateTime(log.created_at)}
                            </span>
                          </div>
                          <div className="mt-1 text-ink/70">
                            {log.actorLabel || (log.actor_role ? log.actor_role : "System")}
                            {log.actor_user_id ? ` • ID #${log.actor_user_id}` : ""}
                            {log.actorName ? ` • ${log.actorName}` : ""}
                            {log.old_status || log.new_status ? ` • ${log.old_status || "-"} → ${log.new_status || "-"}` : ""}
                          </div>
                          {log.note ? <p className="mt-1 whitespace-pre-wrap text-ink/70">{log.note}</p> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRequest.status !== "paid" && selectedRequest.status !== "rejected" && selectedRequest.status !== "cancelled" ? (
                  <div className="mt-4 rounded-[16px] border border-[#ffe7ec] bg-[#fff9fb] p-3">
                    <label className="block text-[0.62rem] font-black uppercase tracking-[0.16em] text-ink/60">
                      Rejection reason
                    </label>
                    <textarea
                      value={rejectionReasonDraft}
                      onChange={(event) => setRejectionReasonDraft(event.target.value)}
                      rows={3}
                      placeholder="Enter reason for rejecting this withdrawal request"
                      className="mt-2 w-full rounded-xl border border-[#f1dfe7] bg-white px-3 py-2 text-[11px] text-ink outline-none focus:border-pink-300 sm:text-xs"
                    />
                  </div>
                ) : null}

                {getActionButtons(selectedRequest)}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
