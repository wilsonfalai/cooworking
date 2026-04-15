import { Injectable, NotFoundException } from '@nestjs/common';
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
