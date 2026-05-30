import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName = process.env.AWS_S3_BUCKET_NAME;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  // File ko S3 par upload karne ka function
  async uploadFile(file: any, folder: string = 'uploads'): Promise<string> {
    try {
      // 1. Ek unique file name banayen (e.g., uploads/abc-123.jpg)
      const uniqueFileName = `${folder}/${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;

      // 2. AWS S3 ko command dena
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFileName,
        Body: file.buffer, // YAHAN MULTER KA MAGIC HAI (Memory Buffer)
        ContentType: file.mimetype,
      });

      // 3. File S3 par bhej do
      await this.s3Client.send(command);

      // 4. File ka Public S3 URL return karo
      const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
      console.log(`☁️ File uploaded to S3: ${fileUrl}`);

      return fileUrl;
    } catch (error) {
      console.error('❌ S3 Upload Error:', error);
      throw new Error('Failed to upload file to AWS S3');
    }
  }




}
