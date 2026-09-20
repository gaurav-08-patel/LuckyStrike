import mysql from "mysql2/promise";

export const dbPool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const connectDB = async (): Promise<void> => {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error("Database environment variables are missing. Check DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME.");
  }

  try {
    const [result] = await dbPool.query("SELECT 1 as connected");
    console.log("MySQL connected successfully", result);
  } catch (error) {
    console.error("MySQL connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
