import express from "express";
import { prisma } from "../index.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

/* ============================================================
   🔹 Obtener todas las penalizaciones
============================================================ */
router.get("/", requireAuth, async (req, res) => {
  try {
    const items = await prisma.penalty.findMany({
      include: { employee: true },
      orderBy: { fechaInicio: "desc" }
    });

    res.json(items);
  } catch (err) {
    console.error("❌ Error al obtener penalizaciones:", err);
    res.status(500).json({ error: "Error interno al obtener penalizaciones" });
  }
});

/* ============================================================
   🔥 Crear penalización manual
   Ruta usada desde el panel de asistencias
============================================================ */
router.post("/manual", requireAuth, async (req, res) => {
  try {
    const { employeeId, motivo, fechaInicio, fechaFin } = req.body;

    // Validación
    if (!employeeId || !motivo || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: "Debe enviar employeeId, motivo, fechaInicio y fechaFin."
      });
    }

    const empleado = await prisma.employee.findUnique({
      where: { id: Number(employeeId) }
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
        registradoPor: req.user?.id || 1
      },
      include: { employee: true }
    });

    res.status(201).json({
      message: "Empleado penalizado correctamente",
      penalizacion
    });
  } catch (err) {
    console.error("❌ Error al penalizar empleado:", err);
    res.status(500).json({ error: "No se pudo penalizar al empleado" });
  }
});

/* ============================================================
   🔹 Registrar penalización desde otros módulos (uso interno)
============================================================ */
router.post("/", requireAuth, async (req, res) => {
  try {
    const created = await prisma.penalty.create({
      data: req.body,
      include: { employee: true }
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("❌ Error al registrar penalización:", err);
    res.status(500).json({ error: "Error al registrar penalización" });
  }
});
/* ============================================================
   🔹 Obtener penalizaciones por empleado
============================================================ */
router.get("/employee/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const items = await prisma.penalty.findMany({
      where: { employeeId: Number(id) },
      orderBy: { fechaInicio: "desc" },
      include: { employee: true }
    });

    res.json(items);
  } catch (err) {
    console.error("❌ Error al obtener penalizaciones del empleado:", err);
    res.status(500).json({ error: "Error al obtener penalizaciones" });
  }
});


/* ============================================================
   🔹 Actualizar penalización
============================================================ */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.penalty.update({
      where: { id: Number(id) },
      data: req.body,
      include: { employee: true }
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Error al actualizar penalización:", err);
    res.status(500).json({ error: "Error al actualizar penalización" });
  }
});

export default router;
