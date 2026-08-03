-- CreateEnum
CREATE TYPE "WaiterCallReason" AS ENUM ('BILL', 'ASSISTANCE', 'PROBLEM');

-- CreateEnum
CREATE TYPE "WaiterCallStatus" AS ENUM ('PENDING', 'ATTENDED');

-- CreateTable
CREATE TABLE "waiter_calls" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "WaiterCallStatus" NOT NULL DEFAULT 'PENDING',
    "attended_at" TIMESTAMP(3),
    "attended_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waiter_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waiter_calls_restaurant_id_status_created_at_idx" ON "waiter_calls"("restaurant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "waiter_calls_session_id_status_idx" ON "waiter_calls"("session_id", "status");

-- AddForeignKey
ALTER TABLE "waiter_calls" ADD CONSTRAINT "waiter_calls_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_calls" ADD CONSTRAINT "waiter_calls_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_calls" ADD CONSTRAINT "waiter_calls_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "table_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
