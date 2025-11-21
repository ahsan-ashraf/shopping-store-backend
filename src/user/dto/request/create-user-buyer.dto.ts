import { IsDecimal } from "class-validator";
import { CreateUserDto } from "./create-user.dto";

export class CreateUserBuyerDto extends CreateUserDto {
  @IsDecimal()
  walletAmount: number;
}
