// ============================================================
// ✅ CARGA MANUAL DE VARIABLES DE ENTORNO
// ============================================================
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // Asegura que lea la DB_URL de la raíz

// ============================================================
// 📦 IMPORTS PRINCIPALES
// ============================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ============================================================
// 🚀 CREACIÓN / ACTUALIZACIÓN DEL USUARIO ADMIN
// ============================================================
async function main() {
  const email = "aespinozaz@unemi.edu.ec";
  const hashed = await bcrypt.hash("alan12345", 10);

  // ✅ Verifica si ya existe un usuario con ese email
  const existing = await prisma.user.findUnique({ where: { email } });

  let admin;
  if (existing) {
    // Si ya existe, lo actualiza
    admin = await prisma.user.update({
      where: { email },
      data: {
        username: "Alan Espinoza",
        role: "JEFE DE PLANTA",
        password: hashed,
        active: true,
      },
    });
    console.log("🟡 Usuario existente actualizado correctamente.");
  } else {
    // Si no existe, lo crea nuevo
    admin = await prisma.user.create({
      data: {
        username: "Alan Espinoza",
        password: hashed,
        email,
        role: "JEFE DE PLANTA",
        active: true,
      },
    });
    console.log("🟢 Usuario administrador creado correctamente.");
  }

  console.table({
    username: admin.username,
    role: admin.role,
    email: admin.email,
  });
}

// ============================================================
// 🧩 EJECUCIÓN SEGURA
// ============================================================
main()
  .catch((err) => {
    console.error("❌ Error creando o actualizando admin:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
