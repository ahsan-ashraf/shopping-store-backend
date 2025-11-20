import { IsBoolean, IsPhoneNumber, IsString, Length } from 'class-validator';

export class AddressDto {
  @IsString()
  @Length(5, 50)
  address: string;

  @IsString()
  @Length(2, 50)
  city: string;

  @IsString()
  @Length(2, 50)
  province: string;

  @IsString()
  @Length(4, 10)
  postalCode: string;

  @IsBoolean()
  isPrimary: boolean;

  @IsPhoneNumber('PK')
  phone: string;
}
