import { Role, Gender } from 'generated/prisma/enums';
import { AddressDto } from '../address/address.dto';

export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  dob: Date;
  role: Role;
  gender: Gender;
  addresses: AddressDto;
}
