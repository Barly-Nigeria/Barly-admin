-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Vendor" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Vendor" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Vendor" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';

UPDATE "Vendor"
SET
  email = 'orders@distillershub.ng',
  phone = '+234 809 441 2201',
  address = '14 Adeola Odeku Street, Victoria Island',
  city = 'Lagos'
WHERE name = 'Distillers Hub Lagos' AND email = '';

UPDATE "Vendor"
SET
  email = 'supply@atlanticmixers.ng',
  phone = '+234 802 118 7740',
  address = '7 Warehouse Road, Apapa',
  city = 'Lagos'
WHERE name = 'Atlantic Mixers Co' AND email = '';

UPDATE "Vendor"
SET
  email = 'ops@chillchain.ng',
  phone = '+234 701 555 0198',
  address = 'Plot 22 Kudirat Abiola Way, Oregun',
  city = 'Ikeja'
WHERE name = 'Chill Chain Logistics' AND email = '';

UPDATE "Vendor"
SET
  email = 'hello@crystalserviceware.ng',
  phone = '+234 813 220 4415',
  address = '18 Admiralty Way, Lekki Phase 1',
  city = 'Lagos'
WHERE name = 'Crystal Serviceware' AND email = '';
