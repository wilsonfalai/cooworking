import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'Unidade Centro', minLength: 2 })
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'unidade-centro' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'Rua Augusta, 100' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'BR' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '01310-100' })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-0000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsIn(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE';
}
