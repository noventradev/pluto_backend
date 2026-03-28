import dotenv from "dotenv";
dotenv.config();
import prisma from "@db/prisma.client";
import app from "./app";
import { initIncomeEntryJob } from "./jobs/income-entry.job";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    // Initialize background jobs
    initIncomeEntryJob();
    console.log("Background jobs initialized");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start", error);
    process.exit(1);
  }
}

startServer();
