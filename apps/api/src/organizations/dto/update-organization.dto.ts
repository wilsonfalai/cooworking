import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsIn(['ACTIVE', 'SUSPENDED', 'TRIAL'])
  @IsOptional()
  status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
}
