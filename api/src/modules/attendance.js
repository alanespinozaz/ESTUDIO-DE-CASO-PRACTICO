import express from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ dest: "uploads/" });

/* ============================================================
   🔹 Obtener registros de asistencia por convocatoria
   GET /attendance?convocationId=ID
============================================================ */
router.get("/", async (req, res) => {
  try {
    const convId = req.query.convocationId
      ? Number(req.query.convocationId)
      : null;

    if (!convId) {
      return res
        .status(400)
        .json({ error: "Debe enviar el parámetro convocationId" });
    }

    const registros = await prisma.attendanceRecord.findMany({
      where: { convocationId: convId },
      include: { employee: true },
      orderBy: [{ fecha: "desc" }, { horaEntrada: "asc" }],
    });

    res.json(registros);
  } catch (err) {
    console.error("Error al obtener asistencias:", err);
    res.status(500).json({ error: "Error al obtener asistencias" });
  }
});

/* ============================================================
   🔹 Subir archivo Excel con marcaciones
   POST /attendance/:convocationId/upload
============================================================ */
router.post(
  "/:convocationId/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const { convocationId } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No se envió ningún archivo" });
      }

      const buffer = fs.readFileSync(req.file.path);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const requiredColumns = ["Cedula", "Fecha", "HoraEntrada", "HoraSalida"];
      const headers = Object.keys(rows[0] || {});
      const missing = requiredColumns.filter((c) => !headers.includes(c));

      if (missing.length) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: `Columnas faltantes: ${missing.join(", ")}`,
        });
      }

      let registros = [];

      for (const row of rows) {
        const cedula = String(row.Cedula).trim();
        if (!cedula) continue;

        const emp = await prisma.employee.findUnique({ where: { cedula } });
        if (!emp) continue;

        let fecha;
        if (typeof row.Fecha === "string" && row.Fecha.includes("/")) {
          const [dia, mes, anio] = row.Fecha.split(/[\/\-]/).map(Number);
          fecha = new Date(anio, mes - 1, dia);
        } else if (typeof row.Fecha === "number") {
          // Fecha en formato Excel
          fecha = new Date((row.Fecha - 25569) * 86400 * 1000);
        } else {
          fecha = new Date(row.Fecha);
        }

        const baseDate = fecha.toISOString().split("T")[0];

        const horaEntrada = row.HoraEntrada
          ? new Date(`${baseDate}T${row.HoraEntrada}`)
          : null;
        const horaSalida = row.HoraSalida
          ? new Date(`${baseDate}T${row.HoraSalida}`)
          : null;

        const registro = await prisma.attendanceRecord.upsert({
          where: {
            employeeId_convocationId: {
              employeeId: emp.id,
              convocationId: Number(convocationId),
            },
          },
          update: {
            fecha,
            horaEntrada,
            horaSalida,
            estado: horaEntrada ? "ASISTIÓ" : "FALTÓ",
          },
          create: {
            employeeId: emp.id,
            convocationId: Number(convocationId),
            fecha,
            horaEntrada,
            horaSalida,
            estado: horaEntrada ? "ASISTIÓ" : "FALTÓ",
          },
          include: { employee: true },
        });

        registros.push(registro);
      }

      fs.unlinkSync(req.file.path);

      res.json({
        message: `Archivo procesado correctamente (${registros.length} registros leídos).`,
        registros,
      });
    } catch (err) {
      console.error("Error al procesar Excel:", err);
      res.status(500).json({ error: "Error al procesar archivo Excel" });
    }
  }
);

/* ============================================================
   🔹 Guardar asistencias manuales por convocatoria
   PATCH /attendance/:convocationId/attendance
============================================================ */
router.patch("/:convocationId/attendance", async (req, res) => {
  try {
    const { convocationId } = req.params;
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res
        .status(400)
        .json({ error: "Datos inválidos en la solicitud" });
    }

    for (const r of updates) {
      const existe = await prisma.convocationEmployee.findFirst({
        where: {
          employeeId: r.employeeId,
          convocationId: Number(convocationId),
        },
      });

      if (existe) {
        await prisma.convocationEmployee.update({
          where: { id: existe.id },
          data: {
            estado: r.estado,
            comentario: r.comentario || "",
          },
        });
      } else {
        await prisma.convocationEmployee.create({
          data: {
            employeeId: r.employeeId,
            convocationId: Number(convocationId),
            estado: r.estado,
            comentario: r.comentario || "",
          },
        });
      }

      // 👇 Penalización automática si marcaste NO_ASISTIO (opcional)
      if (r.estado === "NO_ASISTIO" || r.estado === "FALTÓ") {
        const conv = await prisma.convocation.findUnique({
          where: { id: Number(convocationId) },
        });

        if (conv) {
          const inicio = new Date(conv.fechaTrabajo);
          const fin = new Date(inicio);
          fin.setDate(inicio.getDate() + 3);

          await prisma.penalty.create({
            data: {
              employeeId: r.employeeId,
              motivo: "Falta injustificada",
              fechaInicio: inicio,
              fechaFin: fin,
              activo: true,
              origen: "AUTO",
              registradoPor: 1, // Puedes cambiar 1 por el ID de usuario si usas auth
            },
          });
        }
      }
    }

    res.json({ message: "Asistencias guardadas correctamente" });
  } catch (err) {
    console.error("Error al actualizar asistencias:", err);
    res.status(500).json({ error: "Error al actualizar asistencias" });
  }
});

/* ============================================================
   🔥 NUEVA RUTA: Penalizar manualmente a un empleado
   POST /attendance/penalizar
   (esta es la que está usando tu frontend)
============================================================ */
router.post("/penalizar", async (req, res) => {
  try {
    const { employeeId, motivo, fechaInicio, fechaFin } = req.body;

    if (!employeeId || !motivo || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: "Debe enviar employeeId, motivo, fechaInicio y fechaFin.",
      });
    }

    const empleado = await prisma.employee.findUnique({
      where: { id: Number(employeeId) },
    });

    if (!empleado) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    const penalizacion = await prisma.penalty.create({
      data: {
        employeeId: Number(employeeId),
        motivo,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        activo: true,
        origen: "MANUAL",
        registradoPor: 1, // Cambia a req.user.id si más adelante usas autenticación
      },
      include: { employee: true },
    });

    res.status(201).json({
      message: "Empleado penalizado correctamente",
      penalizacion,
    });
  } catch (err) {
    console.error("Error al penalizar empleado (manual):", err);
    res.status(500).json({ error: "No se pudo penalizar al empleado" });
  }
});

export default router;
