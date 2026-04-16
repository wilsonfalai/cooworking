import { SetMetadata } from '@nestjs/common';

/**
 * AppRole is used purely for access control — independent of the DB PlatformRole enum.
 * 'COLLABORATOR' is a virtual role: any USER with an active OWNER/ADMIN/STAFF Member record.
 */
export type AppRole = 'PLATFORM_ADMIN' | 'COLLABORATOR';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
