import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import bidRoutes from "./routes/bid.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import jobRoutes from "./routes/job.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";
import userRoutes from "./routes/user.routes.js";
import workerRoutes from "./routes/worker.routes.js";
import disputeRoutes from "./routes/dispute.routes.js";
dotenv.config();
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/disputes", disputeRoutes);
// Ruta de prueba
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Servidor FindJob funcionando" });
});
const PORT = process.env.PORT || 3000;
httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    if (process.env.NODE_ENV !== "production") {
        console.log(`🔗 Local: http://localhost:${PORT}`);
        console.log(`🔗 Emulador: http://10.0.2.2:${PORT}`);
    }
});
