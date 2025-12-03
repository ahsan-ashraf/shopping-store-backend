import { IsString, MinLength } from "class-validator";
import { CreateUserDto } from "./create-user.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserSellerDto extends CreateUserDto {
  @ApiProperty({ description: "Sellers Business ID", minLength: 10 })
  @IsString()
  @MinLength(10)
  businessId: string;

  @ApiProperty({
    description: "Seller's International Bank Account Number",
    minLength: 10
  })
  @IsString()
  @MinLength(10)
  IBAN: string;
}
