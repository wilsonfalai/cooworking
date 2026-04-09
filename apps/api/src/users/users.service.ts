import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
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
