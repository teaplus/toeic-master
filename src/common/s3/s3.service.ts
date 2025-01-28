import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  //   GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName =
    process.env.AWS_BUCKET_NAME || 'your-bucket-name'; // Tên bucket của bạn

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-west-1', // Thay bằng vùng của bạn
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY_ID', // Thay bằng Access Key
        secretAccessKey:
          process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_SECRET_ACCESS_KEY', // Thay bằng Secret Key
      },
    });
  }

  // Tạo Pre-Signed URL để upload
  async getPresignedUrl(
    key: string,
    type: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: type,
    });
    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    return url;
  }

  // Upload trực tiếp
  async uploadFile(key: string, body: Buffer | string, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}
