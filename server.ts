import dotenv from "dotenv";
dotenv.config();
console.log("NODE_ENV =", process.env.NODE_ENV);
import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import { connectDatabase } from "./server/db/db";
import apiRoutes from "./server/routes/index";
import { errorMiddleware } from "./server/middleware/error.middleware";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Trust proxy for accurate rate-limiting behind Nginx reverse proxy
  app.set("trust proxy", 1);

  // Establish Database connection (Atlas, with transparent fallback to static file DB)
  await connectDatabase();

  // Basic security and parsing middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Avoid blocking development resources
    crossOriginEmbedderPolicy: false
  }));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Patient uploaded documents static serving
  const uploadsDir = path.join(process.cwd(), "server", "uploads");
  app.use("/uploads", express.static(uploadsDir));

  // Mount central API routes
  app.use("/api", apiRoutes);

  // Global Error handling middleware
  app.use(errorMiddleware as any);

  // Serve static files / Vite asset bundle
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ Starting system in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Starting system in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 MediConnect E-Health System running on port ${PORT}`);
    console.log(`📁 Uploads endpoint available at /uploads`);
  });
}

startServer().catch((err) => {
  console.error("💥 FAILED TO BLUEPRINT THE ARCHITECTURE:", err);
});
export default startServer;
