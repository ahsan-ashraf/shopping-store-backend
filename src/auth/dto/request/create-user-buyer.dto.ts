import { IsDecimal, IsNumber } from "class-validator";
import { CreateUserAdminDto } from "./create-user-admin.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserBuyerDto extends CreateUserAdminDto {
  @ApiProperty({ description: "amount in wallet for this user" })
  @IsNumber()
  walletAmount: number;
}
