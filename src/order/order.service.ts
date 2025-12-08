import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { PrismaService } from "prisma/prisma.service";
import { OrderSelect } from "./shape/order-select";
import { Utils } from "src/utils/utils";

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private async $isValidActor(payload: any) {
    const valid = await Utils.isValidActor(payload.actorId, payload.role, this.prisma);
    if (!valid) {
      throw new NotFoundException(`${payload.role} not found or invalid`);
    }
  }

  async create(dto: CreateOrderDto, payload: any) {
    this.$isValidActor(payload);

    const deliveryAddressExists = await this.prisma.address.count({
      where: { id: dto.deliveryAddressId }
    });
    if (!deliveryAddressExists) {
      throw new BadRequestException("Delivery Address not found");
    }

    try {
      const createdOrder = await this.prisma.order.create({
        data: {
          buyerId: payload.actorId,
          deliveryAddressId: dto.deliveryAddressId,
          paymentMethod: dto.paymentMethod,
          paymentStatus: dto.paymentStatus,
          orderItems: {
            create: dto.orderItems.map((item) => ({
              productId: item.productId,
              qty: item.qty,
              size: item.size,
              color: item.color,
              priceAtPurchase: item.priceAtPurchase,
              salePriceAtPurchase: item.salePriceAtPurchase
            }))
          }
        },

        select: OrderSelect
      });

      // TODO: order created successfully, now initiate another routine here to assign the correct rider for this order.
      return {
        success: true,
        data: createdOrder,
        message: "Order Placed Successfully"
      };
    } catch (err) {
      throw err;
    }
  }

  // admins only
  async findAll(payload: any) {
    this.$isValidActor(payload);

    try {
      const allOrders = await this.prisma.order.findMany({ select: OrderSelect });
      return {
        success: true,
        data: allOrders,
        message: "All Orders Retrived Successfully"
      };
    } catch (err) {
      throw new InternalServerErrorException(`Failed to retrieve all orders: ${err?.message}`);
    }
  }

  async findOne(orderId: string, payload: any) {
    this.$isValidActor(payload);

    try {
      const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: OrderSelect });
      return {
        success: true,
        data: order,
        message: "Order Retrieved Successfully"
      };
    } catch (err) {
      if (err.code === "P2025") {
        throw new BadRequestException("No order found with the provided id");
      }
      throw new InternalServerErrorException(`Failed to find order: ${err?.message}`);
    }
  }

  async findAllOfBuyer(payload: any) {
    this.$isValidActor(payload);

    const allOrdersRelatedToBuyer = await this.prisma.order.findMany({ where: { buyerId: payload.actorId }, select: OrderSelect });
    const response = {
      success: true,
      data: allOrdersRelatedToBuyer,
      message: allOrdersRelatedToBuyer.length ? "Orders retrieved successfully" : "No orders found for this buyer"
    };
    return response;
  }

  async remove(orderId: string, payload: any) {
    this.$isValidActor(payload);

    try {
      const deletedOrder = await this.prisma.order.delete({ where: { id_buyerId: { id: orderId, buyerId: payload.actorId } }, select: OrderSelect });
      return {
        success: true,
        data: deletedOrder,
        message: "Order Deleted Successfully"
      };
    } catch (err) {
      if (err.code === "P2025") {
        // P2025 => Prisma error: record not found
        throw new BadRequestException("No order found with the provided IDs");
      }
      throw new InternalServerErrorException(`Failed to delete order: ${err?.message}`);
    }
  }
}
