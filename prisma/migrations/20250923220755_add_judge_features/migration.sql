-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'ADMIN';

-- AlterEnum
ALTER TYPE "public"."SubmissionStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "public"."Submission" ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "language" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
