import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const collaboratorUser = {
  id: 'user-collab-1',
  email: 'admin@cooworking.com',
  name: 'Admin Cooworking',
  accounts: [{ providerId: 'credential', password: 'hashed_password' }],
};

const regularUser = {
  id: 'user-luiza-1',
  email: 'luiza@teste.com',
  name: 'Luiza Guimarães',
  accounts: [{ providerId: 'credential', password: 'hashed_password' }],
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('deve criar um novo usuário e retornar accessToken', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      usersService.create.mockResolvedValue({
        id: 'new-user-1',
        email: 'novo@test.com',
      } as any);

      const result = await service.register({
        email: 'novo@test.com',
        name: 'Novo User',
        password: 'senha1234',
      });

      expect(result).toEqual({ accessToken: 'mock.jwt.token' });
      expect(bcrypt.hash).toHaveBeenCalledWith('senha1234', 12);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'novo@test.com', password: 'hashed_password' }),
      );
    });

    it('deve lançar ConflictException se o email já estiver cadastrado', async () => {
      usersService.findByEmail.mockResolvedValue(collaboratorUser as any);

      await expect(
        service.register({ email: 'admin@cooworking.com', name: 'Admin', password: 'senha1234' }),
      ).rejects.toThrow(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  // ─── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('deve autenticar colaborador com credenciais válidas e retornar token', async () => {
      usersService.findByEmail.mockResolvedValue(collaboratorUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'admin@cooworking.com',
        password: 'senha1234',
      });

      expect(result).toEqual({ accessToken: 'mock.jwt.token' });
    });

    it('deve autenticar usuário comum (membro de coworking) com credenciais válidas', async () => {
      usersService.findByEmail.mockResolvedValue(regularUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'luiza@teste.com',
        password: 'senha1234',
      });

      expect(result).toEqual({ accessToken: 'mock.jwt.token' });
    });

    it('deve lançar UnauthorizedException para email não cadastrado', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'fantasma@test.com', password: 'senha1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para senha incorreta', async () => {
      usersService.findByEmail.mockResolvedValue(collaboratorUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'admin@cooworking.com', password: 'senha_errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se o usuário não tiver conta credential', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...collaboratorUser,
        accounts: [],
      } as any);

      await expect(
        service.login({ email: 'admin@cooworking.com', password: 'senha1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve usar a mesma mensagem de erro para email e senha inválidos (segurança)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const errorEmailInvalido = await service
        .login({ email: 'naoexiste@test.com', password: 'qualquer' })
        .catch((e: Error) => e.message);

      usersService.findByEmail.mockResolvedValue(collaboratorUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const errorSenhaInvalida = await service
        .login({ email: 'admin@cooworking.com', password: 'errada' })
        .catch((e: Error) => e.message);

      expect(errorEmailInvalido).toBe(errorSenhaInvalida);
    });
  });
});
