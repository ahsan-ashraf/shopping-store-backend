import { Gender, Role, UserStatus } from "@prisma/client";
import { IsDate, IsEmail, IsEnum, IsString, Length, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { CreateUserAddressDto } from "./create-user-address.dto";

export class CreateUserAdminDto {
  @ApiProperty({
    description: "Full name of the user",
    minLength: 3,
    maxLength: 20
  })
  @IsString()
  @Length(3, 20)
  name: string;

  @ApiProperty({ description: "Email address of the user" })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Password for the user account",
    minLength: 6,
    maxLength: 100
  })
  @IsString()
  @Length(6, 100)
  password: string;

  @ApiProperty({
    description: "Date of birth of the user",
    type: String,
    format: "date-time"
  })
  @IsDate()
  @Type(() => Date)
  dob: Date;

  @ApiProperty({ description: "Role of the user", enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ description: "Gender of the user", enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: "Primary address of the user",
    type: () => CreateUserAddressDto
  })
  @ValidateNested()
  @Type(() => CreateUserAddressDto)
  addresses: CreateUserAddressDto[];

  @ApiProperty({ description: "Whether the user active or not" })
  @IsEnum(UserStatus)
  status: UserStatus;
}
