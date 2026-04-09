import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'ClinWork Saúde', minLength: 2 })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'clinwork-saude', description: 'Auto-generated from name if omitted' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/logo.png' })
  @IsString()
  @IsOptional()
  logo?: string;
}
