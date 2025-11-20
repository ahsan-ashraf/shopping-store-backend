import { AddressDto } from 'src/user/dto/address/address.dto';

export class CreateAddressDto extends AddressDto {
  userId: string;
}
