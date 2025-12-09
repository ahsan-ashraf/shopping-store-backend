import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PrismaModule } from "prisma/prisma.module";
import { StoreModule } from "src/store/store.module";

@Module({
  imports: [PrismaModule, StoreModule],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
