@echo off
cd /d "%~dp0web"
if not exist "node_modules" (
  echo Instalando dependencias...
  npm install
)
echo Iniciando Web en http://localhost:5173
npm run dev
