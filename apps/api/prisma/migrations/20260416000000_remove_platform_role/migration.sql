-- AlterTable: remove role column from user
ALTER TABLE "cooworking2"."user" DROP COLUMN "role";

-- DropEnum
DROP TYPE "cooworking2"."PlatformRole";
