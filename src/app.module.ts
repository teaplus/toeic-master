import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeorm from './config/typeorm';
import { AuthModule } from './auth/auth.module';

import { UsersModule } from './users/users.module';
import { TokensModule } from './common/tokens/tokens.module';
import { MailModule } from './common/mail/mail.module';
import { TestModule } from './test/test.module';
import { S3Module } from './common/s3/s3.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm'),
    }),
    AuthModule,
    UsersModule,
    TokensModule,
    MailModule,
    TestModule,
    S3Module,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
