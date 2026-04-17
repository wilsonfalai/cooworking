import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { MembersService } from './members.service.js';
import { CreateMemberDto } from './dto/create-member.dto.js';
import { UpdateMemberDto } from './dto/update-member.dto.js';

@ApiTags('Members')
@ApiBearerAuth()
@Controller('organizations/:orgId/members')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('COLLABORATOR')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Param('orgId') orgId: string, @Body() dto: CreateMemberDto) {
    return this.membersService.create(orgId, dto);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Param('orgId') orgId: string,
    @Query('locationId') locationId?: string,
  ) {
    if (locationId) {
      return this.membersService.findAllByLocation(orgId, locationId);
    }
    const adminLocationIds: string[] = (req.user?.memberships ?? [])
      .filter((m: { role: string }) => m.role === 'OWNER' || m.role === 'ADMIN')
      .map((m: { locationId: string }) => m.locationId);
    return this.membersService.findAllByOrg(orgId, adminLocationIds);
  }

  @Get(':id')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.membersService.findOne(orgId, id);
  }

  @Put(':id')
  update(
    @Req() req: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(orgId, id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.membersService.remove(orgId, id);
  }
}
