import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  async sendMail(@Body() sendMailDto: SendMailDto) {
    const { to, subject, content, isHtml } = sendMailDto;
    return this.mailService.sendMail(to, subject, content, isHtml ?? true);
  }
}
