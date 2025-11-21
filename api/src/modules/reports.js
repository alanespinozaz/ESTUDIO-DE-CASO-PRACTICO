import express from "express";
import { prisma } from "../index.js";
import { requireAuth } from "../middlewares/auth.js";
import PDFDocument from "pdfkit-table";

const router = express.Router();

/* ==========================================================
   🔹 Reporte de Convocatorias (JSON)
========================================================== */
router.get("/convocations", requireAuth, async (req, res) => {
  try {
    const convocations = await prisma.convocation.findMany({
      include: {
        Employees: {
          include: { employee: { include: { area: true } } },
        },
        creadoPor: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = convocations.map((c) => {
      const total = c.Employees.length;
      const asistio = c.Employees.filter(
        (e) => e.estado === "ASISTIO" || e.estado === "ASISTIÓ"
      ).length;
      const falto = c.Employees.filter(
        (e) => e.estado === "NO_ASISTIO" || e.estado === "FALTÓ"
      ).length;
      const justificado = c.Employees.filter(
        (e) => e.estado === "JUSTIFICADO"
      ).length;

      return {
        id: c.id,
        titulo: c.titulo,
        fechaTrabajo: c.fechaTrabajo,
        estado: c.estado,
        creadoPor: c.creadoPor,
        totales: { total, asistio, falto, justificado },
      };
    });

    res.json(result);
  } catch (err) {
    console.error("❌ Error al obtener reportes de convocatorias:", err);
    res.status(500).json({ error: "Error al obtener reportes de convocatorias" });
  }
});

/* ==========================================================
   🔹 Reporte de Empleados (JSON)
========================================================== */
router.get("/employees", requireAuth, async (req, res) => {
  try {
    const { estado, areaId } = req.query;
    const where = {};
    if (estado) where.estado = String(estado).toUpperCase();
    if (areaId) where.areaId = Number(areaId);

    const empleados = await prisma.employee.findMany({
      where,
      include: { area: true },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    res.json(empleados);
  } catch (err) {
    console.error("❌ Error al obtener empleados:", err);
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

/* ==========================================================
   🔹 Reporte PDF de Empleados
========================================================== */
router.get("/employees/pdf", async (req, res) => {
  try {
    const { estado, areaId } = req.query;
    const where = {};
    if (estado) where.estado = String(estado).toUpperCase();
    if (areaId) where.areaId = Number(areaId);

    const empleados = await prisma.employee.findMany({
      where,
      include: { area: true },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    const doc = new PDFDocument({ margin: 40 });
    const filename = `reporte_empleados_${estado || "TODOS"}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // 🔹 Encabezado general
    doc
      .fontSize(18)
      .fillColor("#003366")
      .text("REPORTE DE EMPLEADOS", { align: "center" })
      .moveDown(0.5);
    doc.fontSize(12).fillColor("black").text(`Estado: ${estado || "TODOS"}`);
    doc.text(`Área: ${areaId ? `#${areaId}` : "Todas"}`);
    doc.text(`Generado: ${new Date().toLocaleString("es-EC")}`);
    doc.moveDown(1);

    // 🔹 Tabla principal
    const table = {
      headers: [
        { label: "CÉDULA", property: "cedula", width: 100 },
        { label: "NOMBRES Y APELLIDOS", property: "nombre", width: 200 },
        { label: "ÁREA", property: "area", width: 120 },
        { label: "ESTADO", property: "estado", width: 80, align: "center" },
      ],
      datas: empleados.map((e) => ({
        cedula: e.cedula || "—",
        nombre: `${e.nombres} ${e.apellidos}`,
        area: e.area?.nombre || "—",
        estado: e.estado,
      })),
    };

    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(11),
      prepareRow: () => doc.font("Helvetica").fontSize(10),
      columnSpacing: 10,
      padding: 4,
    });

    // 🔹 Mensaje si no hay registros
    if (empleados.length === 0) {
      doc.moveDown(1);
      doc.text("No hay empleados que coincidan con el filtro.", {
        align: "center",
      });
    }

    doc.end();
  } catch (err) {
    console.error("❌ Error al generar PDF de empleados:", err);
    res.status(500).json({ error: "Error al generar PDF" });
  }
});

/* ==========================================================
   🔹 Reporte PDF de Convocatorias
========================================================== */
router.get("/convocations/pdf", async (req, res) => {
  try {
    const convocations = await prisma.convocation.findMany({
      include: {
        Employees: {
          include: { employee: { include: { area: true } } },
        },
        creadoPor: { select: { username: true, email: true } },
      },
      orderBy: { fechaTrabajo: "desc" },
    });

    const doc = new PDFDocument({ margin: 40 });
    const filename = `reporte_convocatorias.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // 🔹 Título principal
    doc
      .fontSize(18)
      .fillColor("#003366")
      .text("REPORTE DE CONVOCATORIAS", { align: "center" })
      .moveDown(1);

    // 🔹 Tabla principal
    const table = {
      headers: [
        { label: "TÍTULO", property: "titulo", width: 150 },
        { label: "FECHA TRABAJO", property: "fecha", width: 100 },
        { label: "ESTADO", property: "estado", width: 80 },
        { label: "TOTAL", property: "total", width: 50, align: "center" },
        { label: "ASISTIERON", property: "asistio", width: 70, align: "center" },
        { label: "FALTARON", property: "falto", width: 70, align: "center" },
        { label: "JUSTIFICADOS", property: "justificado", width: 80, align: "center" },
      ],
      datas: convocations.map((c) => {
        const total = c.Employees.length;
        const asistio = c.Employees.filter(
          (e) => e.estado === "ASISTIO" || e.estado === "ASISTIÓ"
        ).length;
        const falto = c.Employees.filter(
          (e) => e.estado === "NO_ASISTIO" || e.estado === "FALTÓ"
        ).length;
        const justificado = c.Employees.filter(
          (e) => e.estado === "JUSTIFICADO"
        ).length;

        return {
          titulo: c.titulo,
          fecha: new Date(c.fechaTrabajo).toLocaleDateString("es-EC"),
          estado: c.estado,
          total,
          asistio,
          falto,
          justificado,
        };
      }),
    };

    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(11),
      prepareRow: () => doc.font("Helvetica").fontSize(10),
      columnSpacing: 10,
      padding: 4,
    });

    // 🔹 Mensaje si no hay registros
    if (convocations.length === 0) {
      doc.moveDown(1);
      doc.text("No hay convocatorias registradas.", { align: "center" });
    }

    doc.end();
  } catch (err) {
    console.error("❌ Error al generar PDF de convocatorias:", err);
    res.status(500).json({ error: "Error al generar PDF de convocatorias" });
  }
});

export default router;
