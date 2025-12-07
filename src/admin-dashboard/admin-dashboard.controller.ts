import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminDashboardService } from "./admin-dashboard.service";
import { Roles } from "src/auth/decorators/roles.decorator";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserStatus } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SuperAdmin", "Admin")
@Controller("admin-dashboard")
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get("/highlights")
  async getAverageRating() {
    return await this.service.getHighlights();
  }

  @Get("/recent-orders")
  async getRecentOrders(@Query("active") active: boolean, @Query("page") page: number, @Query("size") size: number) {
    return await this.service.getRecentOrders(active, page, size);
  }

  @Get("/stores-info")
  async getStoresInfo(@Query("pageNo") pageNo: number, @Query("pageSize") pageSize: number) {
    return await this.service.getStoresInfo(pageNo, pageSize);
  }

  @Get("/sellers-info")
  async getSellersInfo(@Query("status") status: UserStatus, @Query("pageNo") pageNo: number, @Query("pageSize") pageSize: number) {
    return await this.service.getSellersInfo(status, pageNo, pageSize);
  }

  @Get("/buyers-info")
  async getBuyersInfo(@Query("status") status: UserStatus, @Query("pageNo") pageNo: number, @Query("pageSize") pageSize: number) {
    return await this.service.getBuyersInfo(status, pageNo, pageSize);
  }

  @Get("/riders-info")
  async getRidersInfo(@Query("status") status: UserStatus, @Query("pageNo") pageNo: number, @Query("pageSize") pageSize: number) {
    return await this.service.getRidersInfo(status, pageNo, pageSize);
  }

  @Roles("SuperAdmin")
  @Get("/admins-info")
  async getAdminsInfo(@Query("status") status: UserStatus, @Query("pageNo") pageNo: number, @Query("pageSize") pageSize: number) {
    return await this.service.getAdminsInfo(status, pageNo, pageSize);
  }
}
