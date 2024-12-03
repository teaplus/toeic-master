import { Module } from '@nestjs/common';
import { TokenService } from './token.services';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './refreshToken.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secterkey',
      signOptions: { expiresIn: '3h' },
    }),
    TypeOrmModule.forFeature([RefreshToken]),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokensModule {}
