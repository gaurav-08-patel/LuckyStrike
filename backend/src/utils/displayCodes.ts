import crypto from "node:crypto";
import type { Pool, PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

export type DisplayCodePrefix = "DA" | "TK";
export type DisplayCodeTable = "draws" | "tickets";
export type DisplayCodeColumn = "draw_code" | "ticket_code";

interface ExistsRow extends RowDataPacket {
  count: number;
}

export const generateDisplayCode = (prefix: DisplayCodePrefix): string => {
  const numberPart = String(crypto.randomInt(100000, 1000000)).padStart(6, "0");
  return `${prefix}-${numberPart}`;
};

export const generateUniqueDisplayCode = async (
  connection: Pool | PoolConnection,
  table: DisplayCodeTable,
  column: DisplayCodeColumn,
  prefix: DisplayCodePrefix,
): Promise<string> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generateDisplayCode(prefix);
    const query = `SELECT COUNT(*) AS count FROM ${table} WHERE ${column} = ? LIMIT 1`;
    const [rows] = await connection.query<ExistsRow[]>(query, [code]);

    if (!rows[0] || Number(rows[0].count) === 0) {
      return code;
    }
  }

  throw new Error(`Could not generate a unique ${prefix} code.`);
};
