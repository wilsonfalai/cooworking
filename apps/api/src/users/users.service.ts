import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  emailVerified: true,
  image: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdWithMembers(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        members: {
          include: {
            organization: { select: { id: true, name: true, slug: true } },
            location: { select: { id: true, name: true, city: true, state: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { providerId: 'credential' },
          select: { password: true },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  }

  /**
   * Returns the user with an `isCollaborator` flag derived from Member records.
   * Used by JwtStrategy so every request knows if the user has collaborator access.
   */
  async findByIdWithCollaboratorStatus(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        members: {
          where: {
            role: { in: ['OWNER', 'ADMIN', 'STAFF'] },
            status: 'ACTIVE',
          },
          select: { organizationId: true },
          take: 1,
        },
      },
    });
    if (!user) return null;
    const { members, ...rest } = user;
    return { ...rest, isCollaborator: members.length > 0 };
  }

  /**
   * Lightweight lookup used by the registration flow.
   * Returns only public fields — does not expose password or full user list.
   */
  async lookupByEmail(email: string) {
    return (
      (await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      })) ?? null
    );
  }

  async createWithPassword(data: { email: string; name: string; password: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.create({ ...data, password: hashedPassword });
  }

  async create(data: { email: string; name: string; password: string }) {
    const now = new Date();
    return this.prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: data.email,
            providerId: 'credential',
            password: data.password,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
    });
  }
}
