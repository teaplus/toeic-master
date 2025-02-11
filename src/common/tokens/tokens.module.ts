import { forwardRef, Module } from '@nestjs/common';
import { TokenService } from './token.services';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from './token.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secterkey',
      signOptions: { expiresIn: '3h' },
    }),
    TypeOrmModule.forFeature([Token]),
    forwardRef(() => UsersModule),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokensModule {}
