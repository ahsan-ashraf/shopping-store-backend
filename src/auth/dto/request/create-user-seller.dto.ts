import { IsString, MinLength } from "class-validator";
import { CreateUserAdminDto } from "./create-user-admin.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserSellerDto extends CreateUserAdminDto {
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
