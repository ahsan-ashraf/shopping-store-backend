import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "./user/user.module";
import { AddressModule } from "./address/address.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true // makes process.env variables available everywhere
    }),
    UserModule,
    AddressModule
  ]
})
export class AppModule {}
