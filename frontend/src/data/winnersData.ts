export type WinnerData = {
  id: string;
  name: string;
  entry_no: string;
  cash: number;
  announced_on: Date | string;
  image: string;
  drawTitle?: string;
  drawCode?: string;
  drawType?: string;
};

export const normalizeWinnerData = (
  winner: Partial<WinnerData> & Record<string, unknown>,
): WinnerData => ({
  id: String(winner.id ?? ""),
  name: String(winner.name ?? "Lucky Winner"),
  entry_no: String(winner.entry_no ?? winner.ticket_code ?? "N/A"),
  cash: Number(winner.cash ?? 0),
  announced_on: winner.announced_on
    ? new Date(String(winner.announced_on))
    : new Date(),
  image: String(winner.image ?? ""),
  drawTitle:
    typeof winner.drawTitle === "string" ? winner.drawTitle : undefined,
  drawCode: typeof winner.drawCode === "string" ? winner.drawCode : undefined,
  drawType: typeof winner.drawType === "string" ? winner.drawType : undefined,
});
 