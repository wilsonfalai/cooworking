import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMemberDto {
  @ApiPropertyOptional({ enum: ['OWNER', 'ADMIN', 'STAFF', 'MEMBER'] })
  @IsIn(['OWNER', 'ADMIN', 'STAFF', 'MEMBER'])
  @IsOptional()
  role?: 'OWNER' | 'ADMIN' | 'STAFF' | 'MEMBER';

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'] })
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
}
