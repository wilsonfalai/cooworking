import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PlatformRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MembersService } from '../members/members.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(organizationId: string, dto: CreateLocationDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const slug = dto.slug || this.slugify(dto.name);

    const existing = await this.prisma.location.findUnique({
      where: { organizationId_slug: { organizationId, slug } },
    });
    if (existing) {
      throw new ConflictException(
        `Slug "${slug}" already exists in this organization`,
      );
    }

    const location = await this.prisma.location.create({
      data: { ...dto, slug, organizationId },
    });

    await this.membersService.autoCreateOwners(organizationId, location.id);

    return location;
  }

  async findAllByOrg(
    organizationId: string,
    user: { id: string; role: PlatformRole },
  ) {
    const where =
      user.role === PlatformRole.PLATFORM_ADMIN
        ? { organizationId }
        : {
            organizationId,
            members: {
              some: { userId: user.id, status: 'ACTIVE' as const },
            },
          };

    return this.prisma.location.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, organizationId },
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async update(organizationId: string, id: string, dto: UpdateLocationDto) {
    await this.findOne(organizationId, id);

    if (dto.slug) {
      const existing = await this.prisma.location.findUnique({
        where: { organizationId_slug: { organizationId, slug: dto.slug } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Slug "${dto.slug}" already exists in this organization`,
        );
      }
    }

    return this.prisma.location.update({ where: { id }, data: dto });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.location.delete({ where: { id } });
  }
}
