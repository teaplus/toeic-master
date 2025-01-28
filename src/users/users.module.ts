import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TokensModule } from 'src/common/tokens/tokens.module';
import { TestSession } from 'src/test/entities/test-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TestSession]),
    forwardRef(() => TokensModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
