import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaModule } from "prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRETE || "supersecrete", signOptions: { expiresIn: "1h" } }), PrismaModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
