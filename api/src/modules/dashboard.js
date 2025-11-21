import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // comparar solo por fecha

    // 👥 EMPLEADOS
    const empleadosActivos = await prisma.employee.count({
      where: { estado: "ACTIVO" },
    });
    const empleadosInactivos = await prisma.employee.count({
      where: { estado: "INACTIVO" },
    });
    const totalEmpleados = empleadosActivos + empleadosInactivos;

    // 📅 CONVOCATORIAS
    const convocatoriasAbiertas = await prisma.convocation.count({
      where: {
        fechaTrabajo: { gte: hoy }, // hoy o futuras
        estado: { in: ["ENVIADA", "BORRADOR"] },
      },
    });

    const convocatoriasCerradas = await prisma.convocation.count({
      where: {
        fechaTrabajo: { lt: hoy }, // pasadas
      },
    });

    const totalConvocatorias = convocatoriasAbiertas + convocatoriasCerradas;

    // ⚠️ PENALIZACIONES
    const penalizacionesActivas = await prisma.penalty.count({
      where: { activo: true },
    });
    const penalizacionesTotales = await prisma.penalty.count();

    // 🧩 ÁREAS (nuevo campo)
    const totalAreas = await prisma.area.count();

    // 📊 RESPUESTA FINAL
    res.json({
      // Empleados
      totalEmpleados,
      empleadosActivos,
      empleadosInactivos,

      // Convocatorias
      totalConvocatorias,
      convocatoriasAbiertas,
      convocatoriasCerradas,

      // Penalizaciones
      penalizacionesActivas,
      penalizacionesTotales,

      // Áreas
      totalAreas,
    });
  } catch (err) {
    console.error("❌ Error en dashboard:", err);
    res
      .status(500)
      .json({ error: "Error al obtener los datos del dashboard" });
  }
});

export default router;
