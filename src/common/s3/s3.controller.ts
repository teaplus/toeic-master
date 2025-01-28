import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { S3Service } from './s3.service';

@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  // API để lấy Pre-Signed URL
  @Get('presigned-url')
  async getPresignedUrl(
    @Query('key') key: string,
    @Query('type') type: string,
  ) {
    const url = await this.s3Service.getPresignedUrl(key, type);
    return { url };
  }

  // API để upload file trực tiếp (nếu cần)
  @Post('upload')
  async uploadFile(
    @Body() body: { key: string; content: string; contentType: string },
  ) {
    const { key, content, contentType } = body;
    const url = await this.s3Service.uploadFile(key, content, contentType);
    return { url };
  }
}
