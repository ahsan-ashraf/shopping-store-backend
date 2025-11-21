import { IsBoolean, IsPhoneNumber, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddressDto {
  @ApiProperty({ description: "Street address", minLength: 5, maxLength: 50 })
  @IsString()
  @Length(5, 50)
  address: string;

  @ApiProperty({ description: "City name", minLength: 2, maxLength: 50 })
  @IsString()
  @Length(2, 50)
  city: string;

  @ApiProperty({ description: "Province name", minLength: 2, maxLength: 50 })
  @IsString()
  @Length(2, 50)
  province: string;

  @ApiProperty({
    description: "Postal or ZIP code",
    minLength: 5,
    maxLength: 5
  })
  @IsString()
  @Length(5, 5)
  postalCode: string;

  @ApiProperty({ description: "Is this the primary address?" })
  @IsBoolean()
  isPrimary: boolean;

  @ApiProperty({ description: "Phone number in PK format" })
  @IsPhoneNumber("PK")
  phone: string;
}
