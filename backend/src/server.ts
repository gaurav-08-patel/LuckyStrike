import app from "./app";
import connectDB from "./config/db";

const PORT = Number(process.env.PORT || 5000);

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
