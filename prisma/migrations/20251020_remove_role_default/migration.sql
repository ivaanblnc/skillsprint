-- RemoveColumn role DEFAULT
-- This ensures OAuth users have NULL role until they select one
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
