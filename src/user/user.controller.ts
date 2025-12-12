import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UpdateUserStatusDto } from "./dto/request/update-user-status.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("profile/:userId")
  async getUserProfile(@Param("userId") userId: string, @Req() req: any) {
    return await this.userService.getProfile(userId, req.user);
  }

  @Roles("Admin", "SuperAdmin")
  @Patch("update-status/:userId")
  async updateUser(@Param("userId") userId: string, @Body() dto: UpdateUserStatusDto, @Req() req: any) {
    return await this.userService.updateStatus(userId, dto, req.user);
  }

  @Roles("Admin", "SuperAdmin")
  @Delete("delete/:userId")
  async deleteUser(@Param("userId") userId: string, @Req() req: any) {
    return await this.userService.deleteUser(userId, req.user);
  }
}
