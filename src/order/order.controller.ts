import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post(":buyerId")
  async create(@Param("buyerId") buyerId: string, @Body() createOrderDto: CreateOrderDto) {
    return await this.orderService.create(buyerId, createOrderDto);
  }

  @Get()
  async findAll() {
    // TODO: validate user/buyer id before sending
    return await this.orderService.findAll();
  }

  @Get(":buyerId")
  async findAllOfBuyer(@Param("buyerId") buyerId: string) {
    // TODO: validate user/buyer id before sending
    return await this.orderService.findAllOfBuyer(buyerId);
  }

  @Get(":orderId")
  async findOne(@Param("orderId") orderId: string) {
    // TODO: validate user/buyer id before sending
    return this.orderService.findOne(orderId);
  }

  @Delete("/:buyerId/:orderId")
  async remove(@Param("buyerId") buyerId: string, @Param("orderId") orderId: string) {
    // TODO: validate user/buyer id before sending
    return this.orderService.remove(buyerId, orderId);
  }
}
