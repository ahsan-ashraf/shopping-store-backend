import { OrderStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty } from "class-validator";

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  @Transform(({ value }) => (value === "" ? undefined : value))
  status: OrderStatus;
}
