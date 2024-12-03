import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Tạo transporter với cấu hình từ biến môi trường
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<boolean>('MAIL_SECURE'), // true nếu sử dụng SSL/TLS
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  // Gửi email
  async sendMail(to: string, subject: string, content: string, isHtml = true) {
    console.log('SMTP Config:', {
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<boolean>('MAIL_SECURE'),
      user: this.configService.get<string>('MAIL_USER'),
      pass: this.configService.get<string>('MAIL_PASSWORD'),
    });
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      subject,
      [isHtml ? 'html' : 'text']: content, // Gửi dạng HTML hoặc plain text
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
