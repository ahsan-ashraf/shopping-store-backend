import { IsDecimal, IsNumber } from "class-validator";
import { CreateUserDto } from "./create-user.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserBuyerDto extends CreateUserDto {
  @ApiProperty({ description: "amount in wallet for this user" })
  @IsNumber()
  walletAmount: number;
}
