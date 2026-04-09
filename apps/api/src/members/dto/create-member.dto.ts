import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  userId: string;

  @IsString()
  locationId: string;

  @IsIn(['OWNER', 'ADMIN', 'STAFF', 'MEMBER'])
  @IsOptional()
  role?: 'OWNER' | 'ADMIN' | 'STAFF' | 'MEMBER';
}
