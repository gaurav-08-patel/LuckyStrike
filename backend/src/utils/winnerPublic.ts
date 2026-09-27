export interface PublicWinnerRow {
  id: number;
  draw_id: number;
  draw_code: string;
  ticket_code: string;
  prize_title: string;
  prize_amount: string | number | null;
  winner_name: string;
  announced_at: string | Date | null;
  draw_title: string;
  draw_type: string;
  image_url?: string | null;
}

export type PublicWinner = {
  id: string;
  name: string;
  entry_no: string;
  cash: number;
  announced_on: Date;
  image: string;
  drawTitle?: string;
  drawCode?: string;
  drawType?: string;
};

export const DEFAULT_WINNER_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80";

export const normalizePublicWinner = (
  row: Partial<PublicWinnerRow>,
): PublicWinner => ({
  id: String(row.id ?? ""),
  name: row.winner_name || "Lucky Winner",
  entry_no: row.ticket_code || row.draw_code || "N/A",
  cash: Number(row.prize_amount ?? 0),
  announced_on: row.announced_at ? new Date(row.announced_at) : new Date(),
  image: row.image_url || DEFAULT_WINNER_IMAGE,
  drawTitle: row.draw_title || "Lucky Strike draw",
  drawCode: row.draw_code || "",
  drawType: row.draw_type || "daily",
});
