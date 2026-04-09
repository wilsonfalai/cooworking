import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.config.getOrThrow('MINIO_ENDPOINT'),
      port: parseInt(this.config.get('MINIO_PORT', '443'), 10),
      useSSL: this.config.get('MINIO_USE_SSL', 'true') === 'true',
      accessKey: this.config.getOrThrow('MINIO_ACCESS_KEY'),
      secretKey: this.config.getOrThrow('MINIO_SECRET_KEY'),
    });
    this.bucket = this.config.get('MINIO_BUCKET', 'cooworking');
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async upload(
    fileName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.client.putObject(this.bucket, fileName, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    return `${fileName}`;
  }

  async getPresignedUrl(
    fileName: string,
    expirySeconds = 3600,
  ): Promise<string> {
    return this.client.presignedGetObject(
      this.bucket,
      fileName,
      expirySeconds,
    );
  }

  async delete(fileName: string): Promise<void> {
    await this.client.removeObject(this.bucket, fileName);
  }
}
