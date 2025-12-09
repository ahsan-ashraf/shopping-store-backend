import { Module } from "@nestjs/common";
import { StoreService } from "./store.service";
import { StoreController } from "./store.controller";
import { PrismaModule } from "prisma/prisma.module";
import { S3Module } from "src/s3/s3.module";
import { ProductModule } from "src/product/product.module";

@Module({
  imports: [PrismaModule, S3Module, ProductModule],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService]
})
export class StoreModule {}
