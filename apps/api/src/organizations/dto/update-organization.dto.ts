import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'ClinWork Saúde', minLength: 2 })
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'clinwork-saude' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/logo.png' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'TRIAL'] })
  @IsIn(['ACTIVE', 'SUSPENDED', 'TRIAL'])
  @IsOptional()
  status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
}
