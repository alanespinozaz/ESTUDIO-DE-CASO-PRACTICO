-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "convocationId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "horaEntrada" DATETIME,
    "horaSalida" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'FALTÓ',
    "comentario" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_convocationId_fkey" FOREIGN KEY ("convocationId") REFERENCES "Convocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AttendanceRecord_convocationId_idx" ON "AttendanceRecord"("convocationId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_employeeId_convocationId_key" ON "AttendanceRecord"("employeeId", "convocationId");
