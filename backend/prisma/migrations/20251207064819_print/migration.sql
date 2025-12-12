/*
  Warnings:

  - You are about to drop the column `quantity` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `unit_price` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `vat_rate` on the `invoice_items` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `invoice_item_templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invoice_item_templates" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vat_rate" DECIMAL(5,2) DEFAULT 0;

-- AlterTable
ALTER TABLE "invoice_items" DROP COLUMN "quantity",
DROP COLUMN "unit_price",
DROP COLUMN "vat_rate";
