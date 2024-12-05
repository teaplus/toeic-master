import { Module } from '@nestjs/common';
import { TokenService } from './token.services';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './refreshToken.entity';
import { VerificationToken } from './verifycationToken.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secterkey',
      signOptions: { expiresIn: '3h' },
    }),
    TypeOrmModule.forFeature([RefreshToken, VerificationToken]),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokensModule {}
