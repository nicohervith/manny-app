import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import bidRoutes from "./routes/bid.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import jobRoutes from "./routes/job.routes.js";
import workerRoutes from "./routes/worker.routes.js";

import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();

const httpServer = createServer(app); // Creamos el servidor HTTP
const io = new Server(httpServer, {
  cors: {
    origin: "*", // En desarrollo permitimos todo
  },
});

// Lógica de Socket.io
io.on("connection", (socket) => {
  console.log("👤 Usuario conectado:", socket.id);

  // Unirse a una "sala" específica de un trabajo
  socket.on("join-chat", (jobId) => {
    socket.join(`chat_${jobId}`); // Importante que el string coincida con el del emit
    console.log(`Sala chat_${jobId} unida por socket ${socket.id}`);
  });

  socket.on("typing", ({ jobId, userName }) => {
    socket.to(`chat_${jobId}`).emit("user-typing", { userName });
  });

  // Evento cuando alguien deja de escribir
  socket.on("stop-typing", (jobId) => {
    socket.to(`chat_${jobId}`).emit("user-stop-typing");
  });

  socket.on("disconnect", () => {
    console.log("👤 Usuario desconectado");
  });
});

// Compartir 'io' con las rutas si es necesario
app.set("io", io);

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/chat", chatRoutes);

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
