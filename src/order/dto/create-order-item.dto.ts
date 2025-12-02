import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min } from "class-validator";

export class CreateOrderItemDto {
  @ApiProperty({ description: "Product's Id" })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: "No of items", minLength: 1 })
  @IsNumber()
  @Min(1)
  qty: number;

  @ApiProperty({ description: "Size" })
  @IsString()
  @IsOptional()
  size: string;

  @ApiProperty({ description: "Color" })
  @IsString()
  @IsOptional()
  color: string;

  @ApiProperty({ description: "Price at the time of Purchase" })
  @IsPositive()
  priceAtPurchase: number;

  @ApiProperty({ description: "Sale Price at the time of Purchase" })
  @Min(0)
  salePriceAtPurchase: number;
}
