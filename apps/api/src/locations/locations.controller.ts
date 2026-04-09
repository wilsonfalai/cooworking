import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';

@ApiTags('Locations')
@ApiBearerAuth()
@Controller('organizations/:orgId/locations')
@UseGuards(AuthGuard('jwt'))
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  create(@Param('orgId') orgId: string, @Body() dto: CreateLocationDto) {
    return this.locationsService.create(orgId, dto);
  }

  @Get()
  findAll(@Param('orgId') orgId: string) {
    return this.locationsService.findAllByOrg(orgId);
  }

  @Get(':id')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.locationsService.findOne(orgId, id);
  }

  @Put(':id')
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(orgId, id, dto);
  }

  @Delete(':id')
  remove(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.locationsService.remove(orgId, id);
  }
}
