-- P5a: HouseholdUnit + IplConfig + UserStatus + IplPayment householdId

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateTable: household_units
CREATE TABLE "household_units" (
    "id" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: household_units unitNumber unique
CREATE UNIQUE INDEX "household_units_unitNumber_key" ON "household_units"("unitNumber");

-- CreateTable: ipl_configs
CREATE TABLE "ipl_configs" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ipl_configs_pkey" PRIMARY KEY ("id")
);

-- AlterTable: users — tambah status (default PENDING) dan householdId
ALTER TABLE "users" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "users" ADD COLUMN "householdId" TEXT;

-- AlterTable: ipl_payments — migrasi dari userId ke householdId
-- Step 1: drop FK dan unique constraint lama
ALTER TABLE "ipl_payments" DROP CONSTRAINT "ipl_payments_userId_fkey";
DROP INDEX "ipl_payments_userId_month_year_key";

-- Step 2: tambah kolom baru
ALTER TABLE "ipl_payments" ADD COLUMN "householdId" TEXT;
ALTER TABLE "ipl_payments" ADD COLUMN "paidByUserId" TEXT;
ALTER TABLE "ipl_payments" ADD COLUMN "dueDate" TIMESTAMP(3);

-- Step 3: hapus kolom userId yang lama
ALTER TABLE "ipl_payments" DROP COLUMN "userId";

-- Step 4: set householdId NOT NULL (aman karena tabel kosong saat migration berjalan)
ALTER TABLE "ipl_payments" ALTER COLUMN "householdId" SET NOT NULL;

-- AddForeignKey: users → household_units
ALTER TABLE "users" ADD CONSTRAINT "users_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "household_units"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: ipl_payments → household_units
ALTER TABLE "ipl_payments" ADD CONSTRAINT "ipl_payments_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "household_units"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ipl_payments → users (paidByUserId, nullable)
ALTER TABLE "ipl_payments" ADD CONSTRAINT "ipl_payments_paidByUserId_fkey"
    FOREIGN KEY ("paidByUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: ipl_configs → users
ALTER TABLE "ipl_configs" ADD CONSTRAINT "ipl_configs_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex: ipl_payments (householdId, month, year) unique
CREATE UNIQUE INDEX "ipl_payments_householdId_month_year_key"
    ON "ipl_payments"("householdId", "month", "year");
