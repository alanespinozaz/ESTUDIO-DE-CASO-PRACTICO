import express from "express";
import { prisma } from "../index.js";
import { requireAuth } from "../middlewares/auth.js";
import { sendMail } from "../services/mail.js";

const router = express.Router();

/* =====================================================
   🔹 OBTENER TODAS LAS CONVOCATORIAS
===================================================== */
router.get("/", requireAuth, async (req, res) => {
  try {
    const convocations = await prisma.convocation.findMany({
      include: {
        Employees: {
          include: {
            employee: { include: { area: true } },
          },
        },
        creadoPor: {
          select: { username: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(convocations);
  } catch (err) {
    console.error("❌ Error al obtener convocatorias:", err.message);
    res.status(500).json({
      error: "Error al obtener convocatorias",
      details: err.message,
    });
  }
});

/* =====================================================
   🔹 OBTENER UNA CONVOCATORIA
===================================================== */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const convocatoria = await prisma.convocation.findUnique({
      where: { id },
      include: {
        Employees: {
          include: {
            employee: { include: { area: true } },
          },
        },
      },
    });

    if (!convocatoria)
      return res.status(404).json({ error: "Convocatoria no encontrada" });

    res.json(convocatoria);
  } catch (err) {
    console.error("❌ Error al obtener convocatoria:", err.message);
    res.status(500).json({ error: "Error al obtener convocatoria" });
  }
});

/* =====================================================
   🔹 CREAR CONVOCATORIA
===================================================== */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { titulo, descripcion, fechaTrabajo, employees = [] } = req.body;

    if (!titulo || !fechaTrabajo) {
      return res
        .status(400)
        .json({ error: "El título y la fecha de trabajo son requeridos." });
    }

    /* =====================================================
       1️⃣ EMPLEADOS CON PENALIZACIÓN ACTIVA
    ====================================================== */
    const penalizados = await prisma.penalty.findMany({
      where: {
        activo: true,
        fechaInicio: { lte: new Date() },
        fechaFin: { gte: new Date() },
      },
      include: { employee: true },
    });

    const bloqueados = new Set(penalizados.map((p) => p.employeeId));

    /* =====================================================
       2️⃣ OBTENER IDS DEL FRONTEND
    ====================================================== */
    const idsSolicitados = employees
      .map((e) => e.employeeId || e.id)
      .filter(Boolean);

    /* =====================================================
       3️⃣ VALIDAR Y FILTRAR EMPLEADOS
    ====================================================== */
    const empleadosValidos = await prisma.employee.findMany({
      where: {
        id: { in: idsSolicitados },
        estado: "ACTIVO",
        Penalties: { none: { activo: true } },
      },
    });

    const elegibles = empleadosValidos.filter(
      (e) => !bloqueados.has(e.id)
    );

    if (elegibles.length === 0) {
      return res.status(400).json({
        error: "Todos los empleados seleccionados tienen penalización activa.",
        penalizados: penalizados.map((p) => ({
          id: p.employeeId,
          nombre: `${p.employee.nombres} ${p.employee.apellidos}`,
          desde: p.fechaInicio,
          hasta: p.fechaFin,
        })),
      });
    }

    /* =====================================================
       4️⃣ CREAR CONVOCATORIA
    ====================================================== */
    const conv = await prisma.convocation.create({
      data: {
        titulo,
        descripcion,
        fechaTrabajo: new Date(fechaTrabajo),
        creadoPorId: req.user?.sub || req.user?.id || 1,
      },
    });

    /* =====================================================
       5️⃣ ASOCIAR EMPLEADOS
    ====================================================== */
    for (const e of elegibles) {
      await prisma.convocationEmployee.create({
        data: {
          convocationId: conv.id,
          employeeId: e.id,
        },
      });
    }

    res.status(201).json({
      ok: true,
      mensaje: "Convocatoria creada correctamente",
      agregados: elegibles.length,
      excluidos: idsSolicitados.length - elegibles.length,
    });
  } catch (err) {
    console.error("❌ Error al crear convocatoria:", err.message);
    res.status(500).json({ error: "Error al crear convocatoria" });
  }
});

/* =====================================================
   🔹 ENVIAR CORREOS
===================================================== */
router.post("/:id/send", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const conv = await prisma.convocation.findUnique({
      where: { id: Number(id) },
      include: {
        Employees: {
          include: {
            employee: { include: { area: true } },
          },
        },
      },
    });

    if (!conv)
      return res.status(404).json({ error: "Convocatoria no encontrada" });

    if (conv.estado === "ENVIADA") {
      return res
        .status(400)
        .json({ error: "Esta convocatoria ya fue enviada previamente." });
    }

    let enviados = 0;

    for (const ce of conv.Employees) {
      const e = ce.employee;
      if (!e?.email) continue;

      try {
        await sendMail({
          to: e.email,
          subject: `[Convocatoria] ${conv.titulo}`,
          html: `
            <p>Estimado/a <b>${e.nombres} ${e.apellidos}</b>,</p>
            <p>Usted ha sido convocado para: <b>${conv.titulo}</b></p>
            <p>Área: <b>${e.area?.nombre || "General"}</b></p>
            <p>Fecha y hora: <b>${new Date(
              conv.fechaTrabajo
            ).toLocaleString()}</b></p>
            <p>${conv.descripcion || ""}</p>
          `,
        });

        enviados++;
      } catch (mailErr) {
        console.error(`❌ Error enviando correo a ${e.email}:`, mailErr.message);
      }
    }

    await prisma.convocation.update({
      where: { id: conv.id },
      data: { estado: "ENVIADA" },
    });

    res.json({
      ok: true,
      enviados,
      total: conv.Employees.length,
      mensaje: "Correos enviados correctamente",
    });
  } catch (err) {
    console.error("❌ Error en envío de correos:", err.message);
    res.status(500).json({ error: "Error al enviar correos" });
  }
});

/* =====================================================
   🔹 REGISTRAR ASISTENCIAS
===================================================== */
router.patch("/:id/attendances", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { updates } = req.body;

    if (!Array.isArray(updates))
      return res.status(400).json({ error: "Formato inválido" });

    const conv = await prisma.convocation.findUnique({
      where: { id: Number(id) },
    });

    if (!conv)
      return res.status(404).json({ error: "Convocatoria no encontrada" });

    for (const u of updates) {
      await prisma.convocationEmployee.update({
        where: {
          convocationId_employeeId: {
            convocationId: Number(id),
            employeeId: u.employeeId,
          },
        },
        data: {
          estado: u.estado,
          comentario: u.comentario || null,
        },
      });

      if (u.estado === "NO_ASISTIO") {
        const inicio = new Date(conv.fechaTrabajo);
        const fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 3);

        await prisma.penalty.create({
          data: {
            employeeId: u.employeeId,
            motivo: "Falta injustificada",
            fechaInicio: inicio,
            fechaFin: fin,
            origen: "AUTO",
            activo: true,
            registradoPor: req.user?.sub || req.user?.id || 1,
          },
        });
      }
    }

    res.json({ ok: true, mensaje: "Asistencias registradas correctamente" });
  } catch (err) {
    console.error("❌ Error al registrar asistencias:", err.message);
    res.status(500).json({ error: "Error al registrar asistencias" });
  }
});

/* =====================================================
   🔹 ELIMINAR CONVOCATORIA
===================================================== */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const conv = await prisma.convocation.findUnique({ where: { id } });
    if (!conv)
      return res.status(404).json({ error: "Convocatoria no encontrada" });

    if (conv.estado === "ENVIADA") {
      return res.status(400).json({
        error: "No se puede eliminar una convocatoria enviada.",
      });
    }

    await prisma.convocationEmployee.deleteMany({
      where: { convocationId: id },
    });

    await prisma.convocation.delete({ where: { id } });

    res.json({ ok: true, mensaje: "Convocatoria eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar convocatoria:", err.message);
    res.status(500).json({ error: "Error al eliminar convocatoria" });
  }
});

export default router;
