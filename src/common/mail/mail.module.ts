import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [ConfigModule],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService], // Export để các module khác sử dụng
})
export class MailModule {}
