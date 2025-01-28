import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

import { TokensModule } from 'src/common/tokens/tokens.module';
import { MailModule } from 'src/common/mail/mail.module';
import { OAuth2Client } from 'google-auth-library';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey', // Replace with a secure key from environment variables
      signOptions: { expiresIn: '1h' },
    }),
    TokensModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OAuth2Client],
  exports: [AuthService],
})
export class AuthModule {}
