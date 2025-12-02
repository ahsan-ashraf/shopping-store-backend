import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "./user/user.module";
import { AddressModule } from "./address/address.module";
import { S3Service } from "./s3/s3.service";
import { S3Controller } from "./s3/s3.controller";
import { StoreModule } from "./store/store.module";
import { S3Module } from "./s3/s3.module";
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UserModule, AddressModule, StoreModule, S3Module, ProductModule, OrderModule],
  controllers: [S3Controller],
  providers: [S3Service]
})
export class AppModule {}
