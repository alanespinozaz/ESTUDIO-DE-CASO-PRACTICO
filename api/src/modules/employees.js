import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

/* ============================================================
   🔹 Obtener empleados (incluye área + penalizaciones activas)
============================================================ */
router.get("/", async (req, res) => {
  try {
    const { q, areaId } = req.query;

    const where = {
      AND: [
        q
          ? {
              OR: [
                { nombres: { contains: q, mode: "insensitive" } },
                { apellidos: { contains: q, mode: "insensitive" } },
                { cedula: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        areaId ? { areaId: Number(areaId) } : {},
        { estado: { not: "INACTIVO" } },
      ],
    };

    const empleados = await prisma.employee.findMany({
      where,
      include: {
        area: true,
        Penalties: {
          where: {
            activo: true,
            fechaInicio: { lte: new Date() },
            fechaFin: { gte: new Date() },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    res.json(empleados);
  } catch (err) {
    console.error("❌ Error al obtener empleados:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/* ============================================================
   🔹 Crear empleado
============================================================ */
router.post("/", async (req, res) => {
  try {
    const { cedula, nombres, apellidos, email, telefono, direccion, areaId } =
      req.body;

    if (!cedula || !nombres || !apellidos || !areaId) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const nuevoEmpleado = await prisma.employee.create({
      data: {
        cedula,
        nombres,
        apellidos,
        email: email || "",
        telefono: telefono || "",
        direccion: direccion || "",
        areaId: Number(areaId),
        estado: "ACTIVO",
      },
      include: { area: true },
    });

    res.json(nuevoEmpleado);
  } catch (err) {
    console.error("❌ Error al crear empleado:", err);

    if (err.code === "P2002") {
      return res.status(400).json({
        error: "Ya existe un empleado con esa cédula o correo.",
        campo: err.meta?.target,
      });
    }

    res.status(500).json({ error: "Error al registrar empleado" });
  }
});

// Actualiza empleado
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { cedula, nombres, apellidos, email, telefono, direccion, areaId, estado } = req.body;

    // Asegúrate de convertir areaId a un número
    const areaIdNumber = Number(areaId);

    // Validar si la conversión fue exitosa
    if (isNaN(areaIdNumber)) {
      return res.status(400).json({ error: "El área proporcionada no es válida" });
    }

    const empleado = await prisma.employee.update({
      where: { id },
      data: {
        cedula,
        nombres,
        apellidos,
        email,
        telefono,
        direccion,
        areaId: areaIdNumber, // Usa el área convertido
        estado
      },
      include: { area: true },
    });

    res.json({ message: "Empleado actualizado correctamente", empleado });
  } catch (error) {
    console.error("❌ Error al actualizar empleado:", error);
    res.status(500).json({ error: "Error al actualizar empleado" });
  }
});


/* ============================================================
   🔹 Inactivar empleado
============================================================ */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const empleado = await prisma.employee.update({
      where: { id: Number(id) },
      data: { estado: "INACTIVO" },
    });

    res.json({ message: "Empleado inactivado correctamente", empleado });
  } catch (err) {
    console.error("❌ Error al inactivar empleado:", err);

    if (err.code === "P2025") {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    res.status(500).json({ error: "Error al inactivar empleado" });
  }
});

/* ============================================================
   🔹 Actualización completa (PUT)
============================================================ */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const empleado = await prisma.employee.update({
      where: { id },
      data: req.body,
      include: { area: true },
    });

    res.json({ message: "Empleado actualizado correctamente", empleado });
  } catch (error) {
    console.error("❌ Error al actualizar empleado:", error);
    res.status(500).json({ error: "Error al actualizar empleado" });
  }
});

export default router;
