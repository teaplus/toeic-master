import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
import { Test } from '../test/entities/test.entity';
import { TestSession } from '../test/entities/test-session.entity';
import { TokensModule } from '../common/tokens/tokens.module';
import { JwtModule } from '@nestjs/jwt';
import { DailyStat } from './entities/daily-stat.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Test, TestSession, DailyStat]),
    TokensModule,
    JwtModule,
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
