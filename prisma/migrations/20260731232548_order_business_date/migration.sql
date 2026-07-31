/*
  Warnings:

  - A unique constraint covering the columns `[restaurant_id,business_date,order_number]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `business_date` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "orders_restaurant_id_order_number_key";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "business_date" DATE NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_restaurant_id_business_date_order_number_key" ON "orders"("restaurant_id", "business_date", "order_number");
