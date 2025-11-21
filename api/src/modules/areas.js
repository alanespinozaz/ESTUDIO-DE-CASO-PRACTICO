import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Normaliza un nombre de área: quita espacios extra y lo deja en MAYÚSCULAS
function normalizeName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/* =========================================
   LISTAR
========================================= */
router.get("/", async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      orderBy: { id: "asc" },
    });
    res.json(areas);
  } catch (err) {
    console.error("❌ Error listando áreas:", err);
    res.status(500).json({ error: "Error al listar áreas" });
  }
});

/* =========================================
   CREAR
========================================= */
router.post("/", async (req, res) => {
  try {
    const raw = req.body?.nombre;
    const nombre = normalizeName(raw);

    if (!nombre) {
      return res.status(400).json({ error: "El nombre del área es obligatorio" });
    }

    // Chequeo de duplicado (normalizado)
    const existe = await prisma.area.findFirst({
      where: { nombre },
    });
    if (existe) {
      return res.status(409).json({ error: "Ya existe un área con ese nombre" });
    }

    const creada = await prisma.area.create({
      data: { nombre },
    });

    res.json(creada);
  } catch (err) {
    console.error("❌ Error creando área:", err);
    res.status(500).json({ error: "Error al crear el área" });
  }
});

/* =========================================
   ACTUALIZAR
========================================= */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const raw = req.body?.nombre;
    const nombre = normalizeName(raw);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    if (!nombre) {
      return res.status(400).json({ error: "El nombre del área es obligatorio" });
    }

    const actual = await prisma.area.findUnique({ where: { id } });
    if (!actual) {
      return res.status(404).json({ error: "Área no encontrada" });
    }

    // Duplicado distinto del mismo registro
    const duplicado = await prisma.area.findFirst({
      where: { nombre, NOT: { id } },
    });
    if (duplicado) {
      return res.status(409).json({ error: "Ya existe otra área con ese nombre" });
    }

    const actualizada = await prisma.area.update({
      where: { id },
      data: { nombre },
    });

    res.json(actualizada);
  } catch (err) {
    console.error("❌ Error actualizando área:", err);
    res.status(500).json({ error: "Error al actualizar el área" });
  }
});

/* =========================================
   ELIMINAR
========================================= */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    await prisma.area.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error eliminando área:", err);
    res.status(500).json({ error: "Error al eliminar el área" });
  }
});

export default router;
