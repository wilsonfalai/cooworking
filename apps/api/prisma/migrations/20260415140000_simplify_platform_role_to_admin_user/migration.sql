-- Simplify PlatformRole: COLLABORATOR + CLIENT → USER
BEGIN;
CREATE TYPE "cooworking2"."PlatformRole_new" AS ENUM ('PLATFORM_ADMIN', 'USER');
ALTER TABLE "cooworking2"."user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "cooworking2"."user" ALTER COLUMN "role" TYPE "cooworking2"."PlatformRole_new"
  USING (
    CASE role::text
      WHEN 'PLATFORM_ADMIN' THEN 'PLATFORM_ADMIN'
      ELSE 'USER'
    END
  )::"cooworking2"."PlatformRole_new";
ALTER TYPE "cooworking2"."PlatformRole" RENAME TO "PlatformRole_old";
ALTER TYPE "cooworking2"."PlatformRole_new" RENAME TO "PlatformRole";
DROP TYPE "cooworking2"."PlatformRole_old";
ALTER TABLE "cooworking2"."user" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;
