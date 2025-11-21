// ✅ Cargar el .env manualmente
import 'dotenv/config';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const registros = await prisma.attendance.findMany();
  console.log("Registros encontrados:", registros.length);
}

main()
  .catch((err) => console.error("Error:", err))
  .finally(async () => await prisma.$disconnect());
