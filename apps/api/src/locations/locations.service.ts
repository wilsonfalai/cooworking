import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.location.create({
      data: { ...dto, slug, organizationId },
    });
  }

  async findAllByOrg(organizationId: string) {
    return this.prisma.location.findMany({
      where: { organizationId },
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
