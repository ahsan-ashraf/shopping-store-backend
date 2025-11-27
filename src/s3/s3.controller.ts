import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors, Body } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { S3Service } from "./s3.service";
import { Express } from "express";

@Controller("s3")
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadSingle(@UploadedFile() file: Express.Multer.File, @Body("folder") folder?: string) {
    const result = await this.s3Service.uploadFile(file, folder);
    return result; // { key, url }
  }

  @Post("upload-multiple")
  @UseInterceptors(FilesInterceptor("files", 10))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[], @Body("folder") folder?: string) {
    const results = await Promise.all(files.map((file) => this.s3Service.uploadFile(file, folder)));
    return results; // array of { key, url }, e.g [{key, url}, {key, url}, ...]
  }
}
