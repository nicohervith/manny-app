import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import workerRoutes from "./routes/worker.routes.js";
import jobRoutes from "./routes/job.routes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/jobs", jobRoutes);

// Ruta de prueba
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor FindJob funcionando" });
});

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor abierto en red local`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`🔗 Emulador: http://10.0.2.2:${PORT}`);
});
