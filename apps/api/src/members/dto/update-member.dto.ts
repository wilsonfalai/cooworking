import { IsOptional, IsIn } from 'class-validator';

export class UpdateMemberDto {
  @IsIn(['OWNER', 'ADMIN', 'STAFF', 'MEMBER'])
  @IsOptional()
  role?: 'OWNER' | 'ADMIN' | 'STAFF' | 'MEMBER';

  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
}
