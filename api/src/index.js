import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";

// ------------------------------------------------------
// IMPORTACIÓN DE RUTAS (MÓDULOS)
// ------------------------------------------------------
import authRouter from "./modules/auth.js";
import usersRouter from "./modules/users.js";
import areasRouter from "./modules/areas.js";
import employeesRouter from "./modules/employees.js";
import convocationsRouter from "./modules/convocations.js"; // ✅ CORRECTA
import penaltiesRouter from "./modules/penalties.js";
import reportsRouter from "./modules/reports.js";
import attendanceRouter from "./modules/attendance.js";
import dashboardRouter from "./modules/dashboard.js";

const app = express();
export const prisma = new PrismaClient();

// ------------------------------------------------------
// MIDDLEWARES
// ------------------------------------------------------
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Carpeta pública
app.use("/uploads", express.static("uploads"));

// ------------------------------------------------------
// REGISTRO DE RUTAS API
// ------------------------------------------------------
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/areas", areasRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/convocations", convocationsRouter); // 🔥 YA FUNCIONA
app.use("/api/penalties", penaltiesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/dashboard", dashboardRouter);

// ------------------------------------------------------
// ENDPOINT RAÍZ (TEST)
// ------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Convocatoria API",
    status: "running",
    version: "1.0.0",
  });
});

// ------------------------------------------------------
// MANEJO DE RUTA NO ENCONTRADA
// ------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
});

// ------------------------------------------------------
// INICIO DEL SERVIDOR
// ------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("📦 Base de datos conectada correctamente");
  } catch (err) {
    console.error("❌ Error al conectar la base de datos:", err);
  }
  console.log(`🚀 API escuchando en http://localhost:${PORT}`);
});
