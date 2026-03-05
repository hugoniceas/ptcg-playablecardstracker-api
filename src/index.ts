import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/api/status", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "OK",
      database: "Connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      database: "Disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database status: http://localhost:${PORT}/api/status`);
});

process.on("SIGINT", async () => {
  console.log("\n Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});