-- Add the missing deletedAt column to member (already applied in DB, resolving drift)
-- AlterTable (noop if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'cooworking2' AND table_name = 'member' AND column_name = 'deletedAt'
  ) THEN
    ALTER TABLE "cooworking2"."member" ADD COLUMN "deletedAt" TIMESTAMP(3);
  END IF;
END $$;

-- AlterEnum: PlatformRole USER -> COLLABORATOR + CLIENT
-- Step 1: migrate existing USER rows to CLIENT before changing the enum
UPDATE "cooworking2"."user" SET role = 'PLATFORM_ADMIN' WHERE role = 'PLATFORM_ADMIN';

BEGIN;
CREATE TYPE "cooworking2"."PlatformRole_new" AS ENUM ('PLATFORM_ADMIN', 'COLLABORATOR', 'CLIENT');
ALTER TABLE "cooworking2"."user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "cooworking2"."user" ALTER COLUMN "role" TYPE "cooworking2"."PlatformRole_new"
  USING (
    CASE role::text
      WHEN 'PLATFORM_ADMIN' THEN 'PLATFORM_ADMIN'
      WHEN 'USER'           THEN 'CLIENT'
      ELSE 'CLIENT'
    END
  )::"cooworking2"."PlatformRole_new";
ALTER TYPE "cooworking2"."PlatformRole" RENAME TO "PlatformRole_old";
ALTER TYPE "cooworking2"."PlatformRole_new" RENAME TO "PlatformRole";
DROP TYPE "cooworking2"."PlatformRole_old";
ALTER TABLE "cooworking2"."user" ALTER COLUMN "role" SET DEFAULT 'CLIENT';
COMMIT;
