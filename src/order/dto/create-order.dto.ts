import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, ValidateNested } from "class-validator";
import { CreateOrderItemDto } from "./create-order-item.dto";
import { Type } from "class-transformer";
import { PaymentMethod, PaymentStatus } from "src/types";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderDto {
  @ApiProperty({ description: "Address's Id" })
  @IsUUID()
  deliveryAddressId: string;

  @ApiProperty({ description: "Payment Method" })
  @IsString()
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: "Payment Status" })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: "Items in order", type: CreateOrderItemDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];
}
