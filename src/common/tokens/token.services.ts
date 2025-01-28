import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Token } from './token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  createToken(payload: any, exp: string) {
    return this.jwtService.sign(payload, {
      expiresIn: exp,
      secret: process.env.JWT_SECRET,
    });
  }

  verifyToken(token: string) {
    try {
      const decode = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'secretkey',
      });
      return decode;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          return 'TokenExpiredError';
        }

        return 'InvalidToken';
      }
      return 'InvalidToken';
    }
  }
  async findToken(token: string, type: any): Promise<Token | undefined> {
    const verificationToken = await this.tokenRepository.findOne({
      where: { token: token, is_used: false, type: type },
      relations: ['user'],
    });
    return verificationToken;
  }
  async saveToken(Token: Partial<Token>): Promise<Token> {
    return this.tokenRepository.save(Token);
  }

  async checkRevokeToken(token: string): Promise<boolean> {
    const Token = await this.tokenRepository.findOne({
      where: { token },
    });
    if (!Token) {
      return true;
    }
    return Token.is_used;
  }

  async revokeToken(token: string): Promise<void> {
    const Token = await this.tokenRepository.findOne({
      where: { token },
    });
    if (Token) {
      Token.is_used = true;
      await this.tokenRepository.save(Token);
    }
  }

  //################################# VerifyToken Repository ######################

  async findVerifyToken(token: string) {
    const verificationToken = await this.tokenRepository.findOne({
      where: { token: token, is_used: false },
      relations: ['user'],
    });

    return verificationToken;
  }
  async saveVerifyToken(verifyToken: Partial<Token>): Promise<Token> {
    return this.tokenRepository.save(verifyToken);
  }

  async checkAdmin(userName: string): Promise<boolean> {
    const user = await this.usersService.findByUsername(userName);
    if (user && user.role == 'admin') {
      return true;
    }
    return false;
  }
}
