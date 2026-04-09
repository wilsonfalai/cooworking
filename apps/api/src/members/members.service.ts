import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMemberDto } from './dto/create-member.dto.js';
import { UpdateMemberDto } from './dto/update-member.dto.js';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateMemberDto) {
    const location = await this.prisma.location.findFirst({
      where: { id: dto.locationId, organizationId },
    });
    if (!location) {
      throw new NotFoundException('Location not found in this organization');
    }

    const existing = await this.prisma.member.findUnique({
      where: { userId_locationId: { userId: dto.userId, locationId: dto.locationId } },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this location');
    }

    return this.prisma.member.create({
      data: {
        userId: dto.userId,
        organizationId,
        locationId: dto.locationId,
        role: dto.role ?? 'MEMBER',
        status: 'ACTIVE',
      },
      include: { user: { select: { id: true, name: true, email: true } }, location: true },
    });
  }

  async findAllByOrg(organizationId: string) {
    return this.prisma.member.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true } }, location: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByLocation(organizationId: string, locationId: string) {
    return this.prisma.member.findMany({
      where: { organizationId, locationId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, organizationId },
      include: { user: { select: { id: true, name: true, email: true } }, location: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async update(organizationId: string, id: string, dto: UpdateMemberDto) {
    await this.findOne(organizationId, id);
    return this.prisma.member.update({
      where: { id },
      data: dto,
      include: { user: { select: { id: true, name: true, email: true } }, location: true },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.member.delete({ where: { id } });
  }

  async autoCreateOwners(organizationId: string, locationId: string) {
    const owners = await this.prisma.member.findMany({
      where: { organizationId, role: 'OWNER' },
      select: { userId: true },
      distinct: ['userId'],
    });

    const creates = owners.map((owner) =>
      this.prisma.member.create({
        data: {
          userId: owner.userId,
          organizationId,
          locationId,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      }),
    );

    await Promise.all(creates);
  }
}
