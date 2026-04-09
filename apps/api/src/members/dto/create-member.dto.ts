import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'uuid-of-location' })
  @IsString()
  locationId: string;

  @ApiPropertyOptional({ enum: ['OWNER', 'ADMIN', 'STAFF', 'MEMBER'], default: 'MEMBER' })
  @IsIn(['OWNER', 'ADMIN', 'STAFF', 'MEMBER'])
  @IsOptional()
  role?: 'OWNER' | 'ADMIN' | 'STAFF' | 'MEMBER';
}
