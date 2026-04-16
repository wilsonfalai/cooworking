import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateOrganizationDto) {
    const slug = dto.slug || this.slugify(dto.name);

    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" is already taken`);
    }

    return this.prisma.organization.create({
      data: { name: dto.name, slug, logo: dto.logo },
    });
  }

  async findAll() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOneById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { locations: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findOne(id: string, user: { id: string; isCollaborator: boolean }) {
    const org = await this.findOneById(id);

    if (user.isCollaborator) {
      const member = await this.prisma.member.findFirst({
        where: { organizationId: id, userId: user.id },
      });
      if (!member) throw new ForbiddenException('Access denied to this organization');
    }

    return org;
  }

  async findByUserId(userId: string) {
    const member = await this.prisma.member.findFirst({
      where: { userId },
      include: {
        organization: { include: { locations: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!member) throw new NotFoundException('No organization found for this user');
    return member.organization;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: { locations: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOneById(id);

    if (dto.slug) {
      const existing = await this.prisma.organization.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Slug "${dto.slug}" is already taken`);
      }
    }

    return this.prisma.organization.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneById(id);
    return this.prisma.organization.delete({ where: { id } });
  }
}
