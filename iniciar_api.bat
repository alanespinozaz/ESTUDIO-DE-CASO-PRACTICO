@echo off
cd /d "%~dp0api"
if not exist "node_modules" (
  echo Instalando dependencias...
  npm install
)
echo Generando Prisma client...
npx prisma generate
echo Aplicando migraciones...
npx prisma migrate dev --name init
echo Iniciando API en http://localhost:3000
npm run dev
