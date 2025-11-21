Aplicativo web para la asignación de turnos y control de asistencia para una empresa camaronera. 

Este proyecto incluye:

* **Frontend:** React + Vite + TailwindCSS
* **Backend:** Node.js + Express
* **Base de Datos:** SQLite
* **ORM:** Prisma
* **Autenticación:** JWT
* **Notificaciones:** Nodemailer + Mailtrap

# **Requisitos Previos**

Antes de ejecutar el proyecto, asegúrate de tener instalado:

* **Node.js v18+**
* **NPM o Yarn**
* **Git**
* **SQLite** (no requiere instalación adicional)
* **Mailtrap** (opcional para pruebas de correo)

# **Configuración del Backend (Node.js + Express)**

## Entrar a la carpeta del backend

```bash
cd backend
```

##  Instalar dependencias

```bash
npm install
```

##  Crear archivo **.env**

Crear un archivo en `/backend/.env` y pegar:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="micontraseñasecreta"
JWT_EXPIRES="1h"

MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=TU_USER_MAILTRAP
MAIL_PASS=TU_PASS_MAILTRAP
```

## Ejecutar Prisma

### Crear la base de datos y generar el cliente

```bash
npx prisma migrate dev --name init
```

### Visualizar la BD en Prisma Studio

```bash
npx prisma studio
```

##  Iniciar el servidor

```bash
npm run dev
```

Backend corriendo en:

 **[http://localhost:3000](http://localhost:3000)**

---

#  **Configuración del Frontend (React + Vite + Tailwind)**

## Entrar a la carpeta del frontend

```bash
cd frontend
```

## Instalar dependencias

```bash
npm install
```

## Crear archivo **.env**

En `/frontend/.env`:

```
VITE_API_BASE="http://localhost:3000/api"
```

## Iniciar el servidor del frontend

```bash
npm run dev
```

Frontend disponible en:

**[http://localhost:5173](http://localhost:5173)**

---

#  **Conexión Frontend ↔ Backend**

El frontend consume la API mediante Axios usando:

```
VITE_API_BASE=http://localhost:3000/api
```

Asegúrate de que el backend esté ejecutándose antes que el frontend.

---

# **Base de Datos — SQLite + Prisma**

* No requiere instalación de servidor.
* El archivo se genera automáticamente:

```
/backend/prisma/dev.db
```

### Comandos Útiles de Prisma

| Acción             | Comando                  |
| ------------------ | ------------------------ |
| Migrar cambios     | `npx prisma migrate dev` |
| Ver BD visualmente | `npx prisma studio`      |
| Regenerar cliente  | `npx prisma generate`    |

---

# **Pruebas de correo (Mailtrap + Nodemailer)**

El sistema envía correos al crear una convocatoria usando Mailtrap.

Regístrate en: [https://mailtrap.io](https://mailtrap.io)

Configura las credenciales en tu .env:

```
MAIL_USER=xxxx
MAIL_PASS=xxxx
```

---

# 📄 **Scripts del Backend**

```json
"scripts": {
  "dev": "nodemon src/index.js",
  "start": "node src/index.js",
  "prisma": "prisma"
}
```

---

# **Usuarios y Login**

El sistema usa JWT para autenticación.

Endpoint:

```
POST /api/auth/login
```

Ejemplo body:

```json
{
  "username": "admin",
  "password": "123456"
}
```

---

# **Construcción para Producción**

## Frontend (build)

```bash
npm run build
```

## Backend (modo producción)

```bash
npm start
```

---

# **Cómo clonar y ejecutar desde cero**

```bash
git clone https://github.com/tuusuario/turepositorio.git
cd proyecto
```

### Backend:

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

# **Proyecto listo para ejecutarse**
