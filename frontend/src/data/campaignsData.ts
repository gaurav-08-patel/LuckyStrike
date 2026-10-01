export type Campaign = {
  id: string;
  draw_code?: string;
  title: string;
  prizeType: "Cash" | "Car" | "Electronics" | string;
  cashPrizeValue: number | null;
  currency: string;
  entryFrom: number;
  drawDate: string;
  lastRegistration: string | null;
  campaignType: "daily" | "weekly" | "monthly";
  entriesMultiplier: string | null;
  image: string;
  soldCount: number | null;
  soldTotal: number | null;
  max_tickets?: number | null;
};

const normalizePrizeType = (prizeTitle: unknown): Campaign["prizeType"] => {
  const value = String(prizeTitle ?? "")
    .trim()
    .toLowerCase();

  if (!value) return "Cash";
  if (value.includes("car")) return "Car";
  if (
    value.includes("electronics") ||
    value.includes("phone") ||
    value.includes("laptop") ||
    value.includes("device") ||
    value.includes("watch")
  ) {
    return "Electronics";
  }

  return "Cash";
};

export const normalizeCampaignData = (
  backendDraw: Record<string, unknown>,
): Campaign => {
  const prizeAmount = Number(backendDraw.prize_amount ?? 0);
  const ticketPrice = Number(backendDraw.ticket_price ?? 0);
  const maxTickets = Number(backendDraw.max_tickets ?? 0);
  const ticketsSold = Number(backendDraw.tickets_sold ?? 0);
  const campaignType = String(backendDraw.draw_type ?? "daily")
    .trim()
    .toLowerCase();

  return {
    id: String(backendDraw.id ?? ""),
    draw_code: backendDraw.draw_code
      ? String(backendDraw.draw_code)
      : undefined,
    title: String(backendDraw.title ?? "Untitled draw"),
    prizeType: normalizePrizeType(backendDraw.prize_title),
    cashPrizeValue:
      normalizePrizeType(backendDraw.prize_title) === "Cash" &&
      Number.isFinite(prizeAmount)
        ? prizeAmount
        : null,
    currency: "INR",
    entryFrom: Number.isFinite(ticketPrice) ? ticketPrice : 0,
    drawDate: String(backendDraw.draw_at ?? ""),
    lastRegistration: backendDraw.expires_at
      ? String(backendDraw.expires_at)
      : null,
    campaignType:
      campaignType === "weekly"
        ? "weekly"
        : campaignType === "monthly"
          ? "monthly"
          : "daily",
    entriesMultiplier: null,
    image: String(backendDraw.image ?? ""),
    soldCount: Number.isFinite(ticketsSold) ? ticketsSold : 0,
    soldTotal: Number.isFinite(maxTickets) ? maxTickets : 0,
    max_tickets: Number.isFinite(maxTickets) ? maxTickets : null,
  };
};

export const normalizeCampaignsData = (
  backendDraws: Record<string, unknown>[] | unknown,
): Campaign[] => {
  if (!Array.isArray(backendDraws)) {
    return [];
  }

  return backendDraws.map((draw) =>
    normalizeCampaignData(
      typeof draw === "object" && draw !== null ? draw : {},
    ),
  );
};
