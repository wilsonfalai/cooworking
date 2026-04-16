import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('PLATFORM_ADMIN', 'COLLABORATOR')
  create(@Body() body: { name: string; email: string; password: string }) {
    return this.usersService.createWithPassword(body);
  }

  @Get('lookup')
  @Roles('PLATFORM_ADMIN', 'COLLABORATOR')
  lookup(@Query('email') email: string) {
    return this.usersService.lookupByEmail(email);
  }

  @Get()
  @Roles('PLATFORM_ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('PLATFORM_ADMIN')
  findOne(@Param('id') id: string) {
    return this.usersService.findByIdWithMembers(id);
  }
}
