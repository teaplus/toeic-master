import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from './mail.service';
// import { SendMailDto } from './dto/send-mail.dto';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  async sendMail(
    @Body()
    body: {
      to: string;
      subject: string;
      username: string;
      content: string;
    },
  ) {
    const { to, subject, content } = body;
    return this.mailService.sendEmail(to, subject, content);
  }
}
