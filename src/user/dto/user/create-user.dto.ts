import { Role, Gender } from 'generated/prisma/enums';
import { AddressDto } from '../address/address.dto';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsString,
  Length,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @Length(3, 20)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 100)
  password: string;

  @IsDate()
  dob: Date;

  @IsEnum(Role)
  role: Role;

  @IsEnum(Gender)
  gender: Gender;

  @ValidateNested()
  @Type(() => AddressDto)
  addresses: AddressDto;
}
