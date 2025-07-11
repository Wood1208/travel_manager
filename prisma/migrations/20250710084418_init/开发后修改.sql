-- AlterTable
ALTER TABLE "Attraction" ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
