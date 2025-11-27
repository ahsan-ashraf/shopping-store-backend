import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "./user/user.module";
import { AddressModule } from "./address/address.module";
import { S3Service } from "./s3/s3.service";
import { S3Controller } from "./s3/s3.controller";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UserModule, AddressModule],
  controllers: [S3Controller],
  providers: [S3Service]
})
export class AppModule {}
