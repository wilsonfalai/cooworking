import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MembersService } from './members.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const orgId = 'org-1';
const locationId = 'loc-1';
const userId = 'user-luiza-1';
const memberId = 'member-1';

const mockLocation = { id: locationId, organizationId: orgId, name: 'Filial Centro' };

const mockMember = {
  id: memberId,
  userId,
  organizationId: orgId,
  locationId,
  role: 'MEMBER',
  status: 'ACTIVE',
  user: { id: userId, name: 'Luiza Guimarães', email: 'luiza@teste.com' },
  location: mockLocation,
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('MembersService', () => {
  let service: MembersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      location: { findFirst: jest.fn() },
      member: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('deve criar membro com role MEMBER por padrão', async () => {
      (prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation);
      (prisma.member.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.member.create as jest.Mock).mockResolvedValue(mockMember);

      const result = await service.create(orgId, { userId, locationId });

      expect(prisma.member.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'MEMBER', status: 'ACTIVE' }),
        }),
      );
      expect(result).toEqual(mockMember);
    });

    it('deve criar membro com role STAFF quando especificado', async () => {
      (prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation);
      (prisma.member.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.member.create as jest.Mock).mockResolvedValue({ ...mockMember, role: 'STAFF' });

      await service.create(orgId, { userId, locationId, role: 'STAFF' });

      expect(prisma.member.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'STAFF' }),
        }),
      );
    });

    it('deve lançar NotFoundException se a location não pertencer à organização', async () => {
      (prisma.location.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(orgId, { userId, locationId: 'loc-outra-org' }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.member.create).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException se o usuário já for membro da location', async () => {
      (prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation);
      (prisma.member.findUnique as jest.Mock).mockResolvedValue(mockMember);

      await expect(
        service.create(orgId, { userId, locationId }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.member.create).not.toHaveBeenCalled();
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('deve retornar o membro quando encontrado na organização', async () => {
      (prisma.member.findFirst as jest.Mock).mockResolvedValue(mockMember);

      const result = await service.findOne(orgId, memberId);
      expect(result).toEqual(mockMember);
    });

    it('deve lançar NotFoundException se o membro não pertencer à organização', async () => {
      (prisma.member.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('org-outra', memberId)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar role do membro', async () => {
      (prisma.member.findFirst as jest.Mock).mockResolvedValue(mockMember);
      (prisma.member.update as jest.Mock).mockResolvedValue({ ...mockMember, role: 'ADMIN' });

      const result = await service.update(orgId, memberId, { role: 'ADMIN' });
      expect(result.role).toBe('ADMIN');
    });

    it('deve atualizar status do membro', async () => {
      (prisma.member.findFirst as jest.Mock).mockResolvedValue(mockMember);
      (prisma.member.update as jest.Mock).mockResolvedValue({ ...mockMember, status: 'INACTIVE' });

      const result = await service.update(orgId, memberId, { status: 'INACTIVE' });
      expect(result.status).toBe('INACTIVE');
    });

    it('deve lançar NotFoundException ao tentar atualizar membro de outra organização', async () => {
      (prisma.member.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('org-outra', memberId, { role: 'ADMIN' }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.member.update).not.toHaveBeenCalled();
    });
  });

  // ─── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deve remover membro existente', async () => {
      (prisma.member.findFirst as jest.Mock).mockResolvedValue(mockMember);
      (prisma.member.delete as jest.Mock).mockResolvedValue(mockMember);

      await service.remove(orgId, memberId);
      expect(prisma.member.delete).toHaveBeenCalledWith({ where: { id: memberId } });
    });

    it('deve lançar NotFoundException ao tentar remover membro de outra organização', async () => {
      (prisma.member.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('org-outra', memberId)).rejects.toThrow(NotFoundException);
      expect(prisma.member.delete).not.toHaveBeenCalled();
    });
  });

  // ─── autoCreateOwners ──────────────────────────────────────────────────────

  describe('autoCreateOwners', () => {
    it('deve criar Member de OWNER para cada owner existente na nova location', async () => {
      const owners = [{ userId: 'owner-1' }, { userId: 'owner-2' }];
      (prisma.member.findMany as jest.Mock).mockResolvedValue(owners);
      (prisma.member.create as jest.Mock).mockResolvedValue({});

      await service.autoCreateOwners(orgId, 'loc-nova');

      expect(prisma.member.create).toHaveBeenCalledTimes(2);
      expect(prisma.member.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'owner-1',
            locationId: 'loc-nova',
            role: 'OWNER',
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('não deve criar nenhum Member se não houver owners na organização', async () => {
      (prisma.member.findMany as jest.Mock).mockResolvedValue([]);

      await service.autoCreateOwners(orgId, 'loc-nova');

      expect(prisma.member.create).not.toHaveBeenCalled();
    });
  });
});
