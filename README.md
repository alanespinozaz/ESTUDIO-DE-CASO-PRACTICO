# CONVOCATORIA — SQLite Edition (Windows-friendly, sin Docker)

Backend: Node.js + Express + Prisma (SQLite)
Frontend: React + Vite + Tailwind

## Requisitos
- Node.js LTS: https://nodejs.org/en/download

## 1) Preparar backend (primera vez)
```bash
cd api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
La API quedará en: http://localhost:3000

### Crear el primer usuario (base vacía)
Con la base vacía no existen usuarios. Crea el primero (ADMIN) con:
```bash
curl -X POST http://localhost:3000/auth/first-user ^
 -H "Content-Type: application/json" ^
 -d "{\"username\": \"admin\", \"password\": \"admin123\", \"email\": \"admin@example.com\", \"role\": \"ADMIN\"}"
```
(En Postman o similar también funciona).

## 2) Iniciar frontend
```bash
cd web
npm install
npm run dev
```
Front: http://localhost:5173

## Scripts Windows (doble clic)
- iniciar_api.bat
- iniciar_web.bat

## .env backend (ya configurado a SQLite)
DATABASE_URL="file:./convocatoria.db"
