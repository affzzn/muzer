-- AlterTable
ALTER TABLE "Stream" ADD COLUMN     "played" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playedTimeStamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
