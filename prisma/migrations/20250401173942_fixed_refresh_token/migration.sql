/*
  Warnings:

  - You are about to drop the column `refeshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refeshTokenExpiry` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "refeshToken",
DROP COLUMN "refeshTokenExpiry",
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "refreshTokenExpiry" TIMESTAMP(3);
