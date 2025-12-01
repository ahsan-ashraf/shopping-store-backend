import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_Bucket!;
    this.s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS!,
        secretAccessKey: process.env.AWS_SECRETE!
      }
    });
  }

  async uploadFile(file: Express.Multer.File, folder = "_uploads", isPublic = true) {
    try {
      const key = `${folder}/${uuidv4()}-${file.originalname}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
          //   ACL: isPublic ? "public-read" : undefined // make public if needed   // commented out because bucket is not allowing ACL
        })
      );

      // Public URL for always-accessible files
      const publicUrl = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return { key, url: publicUrl };
    } catch (err) {
      throw new InternalServerErrorException("-=>1. Failed to upload file to S3: " + err?.message);
    }
  }

  async deleteFile(key: string) {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key
        })
      );
      return { message: "File deleted successfully" };
    } catch (err) {
      throw new InternalServerErrorException("-=>2. Failed to delete file from s3");
    }
  }

  async copyFile(oldKey: string, newKey: string) {
    await this.s3.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${oldKey}`,
        Key: newKey
      })
    );
  }

  async moveFile(oldKey: string, newKey: string) {
    await this.copyFile(oldKey, newKey);
    await this.deleteFile(oldKey);
  }
}
