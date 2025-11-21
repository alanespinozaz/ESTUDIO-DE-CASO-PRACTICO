-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "direccion" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ConvocationEmployee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "convocationId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CONVOCADO',
    "comentario" TEXT,
    "assignedAreaId" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConvocationEmployee_convocationId_fkey" FOREIGN KEY ("convocationId") REFERENCES "Convocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConvocationEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConvocationEmployee_assignedAreaId_fkey" FOREIGN KEY ("assignedAreaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ConvocationEmployee" ("comentario", "convocationId", "employeeId", "estado", "id", "updatedAt") SELECT "comentario", "convocationId", "employeeId", "estado", "id", "updatedAt" FROM "ConvocationEmployee";
DROP TABLE "ConvocationEmployee";
ALTER TABLE "new_ConvocationEmployee" RENAME TO "ConvocationEmployee";
CREATE UNIQUE INDEX "ConvocationEmployee_convocationId_employeeId_key" ON "ConvocationEmployee"("convocationId", "employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
