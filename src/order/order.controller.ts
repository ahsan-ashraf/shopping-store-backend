import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dt";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("Buyer", "Admin", "SuperAdmin")
@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return await this.orderService.create(dto, req.user);
  }

  @Roles("Admin", "SuperAdmin")
  @Get()
  async findAll(@Req() req: any) {
    return await this.orderService.findAll(req.user);
  }

  @Get("/buyer")
  async findAllOfBuyer(@Req() req: any) {
    return await this.orderService.findAllOfBuyer(req.user);
  }

  @Get(":orderId")
  async findOne(@Param("orderId") orderId: string, @Req() req: any) {
    return this.orderService.findOne(orderId, req.user);
  }

  // TODO: TBD: who will udpate order status????
  @Post(":orderId")
  async updateStatus(@Param("orderId") orderId: string, dto: UpdateOrderStatusDto, @Req() req: any) {
    return this.orderService.updateStatus(orderId, dto, req.user);
  }

  @Delete("/:orderId")
  async remove(@Param("orderId") orderId: string, @Req() req: any) {
    // TODO: validate user/buyer id before sending
    return this.orderService.remove(orderId, req.user);
  }
}
