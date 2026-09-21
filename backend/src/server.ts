import cron from "node-cron";
import dotenv from "dotenv";
import app from "./app";
import connectDB, { dbPool } from "./config/db";
import { settleDraw } from "./utils/drawSettlement";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

// Function to settle expired draws
const settleExpiredDraws = async (): Promise<void> => {
  const [rows] = await dbPool.query<any[]>(
    "SELECT id FROM draws WHERE status = 'active' AND expires_at <= NOW()",
  );

  for (const row of rows) {
    const connection = await dbPool.getConnection();
    try {
      await settleDraw(connection, Number(row.id));
    } catch (error) {
      console.error(`Failed to settle draw ${row.id}:`, error);
    } finally {
      connection.release();
    }
  }
};

const startServer = async (): Promise<void> => {
  await connectDB();

  // Schedule the task to run every 30 seconds
  cron.schedule("*/30 * * * * *", async () => {
    await settleExpiredDraws();
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
