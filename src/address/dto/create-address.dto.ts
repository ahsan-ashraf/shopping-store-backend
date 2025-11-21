import { IsBoolean, IsPhoneNumber, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAddressDto {
  @ApiProperty({ example: "123 Main Street", description: "Street address" })
  @IsString()
  @Length(5, 50)
  address: string;

  @ApiProperty({ example: "Karachi", description: "City name" })
  @IsString()
  @Length(2, 50)
  city: string;

  @ApiProperty({ example: "Sindh", description: "Province name" })
  @IsString()
  @Length(2, 50)
  province: string;

  @ApiProperty({ example: "74400", description: "Postal or ZIP code" })
  @IsString()
  @Length(4, 10)
  postalCode: string;

  @ApiProperty({ example: true, description: "Is this the primary address?" })
  @IsBoolean()
  isPrimary: boolean;

  @ApiProperty({
    example: "03001234567",
    description: "Phone number in PK format"
  })
  @IsPhoneNumber("PK")
  phone: string;
}
