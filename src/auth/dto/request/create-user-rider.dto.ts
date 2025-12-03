import { IsPhoneNumber, IsString, Length, min } from "class-validator";
import { CreateUserAdminDto } from "./create-user-admin.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserRiderDto extends CreateUserAdminDto {
  @ApiProperty({
    description: "Vehice Registration No",
    minLength: 7,
    maxLength: 11
  })
  @IsString()
  @Length(7, 11)
  vehicleRegNo: string;

  @ApiProperty({ description: "Phone provided by Company" })
  @IsPhoneNumber("PK")
  companyPhone: string;
}
