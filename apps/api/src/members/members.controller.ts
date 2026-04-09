import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MembersService } from './members.service.js';
import { CreateMemberDto } from './dto/create-member.dto.js';
import { UpdateMemberDto } from './dto/update-member.dto.js';

@Controller('organizations/:orgId/members')
@UseGuards(AuthGuard('jwt'))
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Param('orgId') orgId: string, @Body() dto: CreateMemberDto) {
    return this.membersService.create(orgId, dto);
  }

  @Get()
  findAll(
    @Param('orgId') orgId: string,
    @Query('locationId') locationId?: string,
  ) {
    if (locationId) {
      return this.membersService.findAllByLocation(orgId, locationId);
    }
    return this.membersService.findAllByOrg(orgId);
  }

  @Get(':id')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.membersService.findOne(orgId, id);
  }

  @Put(':id')
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(orgId, id, dto);
  }

  @Delete(':id')
  remove(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.membersService.remove(orgId, id);
  }
}
