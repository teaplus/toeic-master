import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './refreshToken.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { VerificationToken } from './verifycationToken.entity';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(VerificationToken)
    private readonly verifyTokenRepository: Repository<VerificationToken>,
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
      console.log('decodeee', decode);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findToken(__token: string): Promise<RefreshToken | undefined> {
    return;
  }
  async saveToken(refreshToken: Partial<RefreshToken>): Promise<RefreshToken> {
    return this.refreshTokenRepository.save(refreshToken);
  }

  async checkRevokeToken(token: string): Promise<boolean> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });
    console.log('refreshtoken', refreshToken);
    if (!refreshToken) {
      return true;
    }
    return refreshToken.revoked;
  }

  async revokeToken(token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });
    if (refreshToken) {
      refreshToken.revoked = true;
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  //################################# VerifyToken Repository ######################

  async saveVerifyToken(
    verifyToken: Partial<VerificationToken>,
  ): Promise<VerificationToken> {
    return this.verifyTokenRepository.save(verifyToken);
  }
}
