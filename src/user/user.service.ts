import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { CreateUserDto } from "./dto/request/create-user.dto";
import { UpdateUserDto } from "./dto/request/update-user.dto";
import * as bcrypt from "bcrypt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { CreateUserRiderDto } from "./dto/request/create-user-rider.dto";
import { CreateUserBuyerDto } from "./dto/request/create-user-buyer.dto";
import { CreateUserSellerDto } from "./dto/request/create-user-seller.dto";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async $getHashedPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async createAdmin(dto: CreateUserDto) {
    const hashedPassword = await this.$getHashedPassword(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          dob: dto.dob,
          role: dto.role,
          gender: dto.gender,
          addresses: {
            create: dto.addresses
          }
        },
        include: {
          addresses: true
        }
      });

      const { password, ...result } = user;
      return result;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(`User with this ${err.meta?.target?.[0]} already exists.`);
      }
      throw err;
    }
  }
  async createBuyer(dto: CreateUserBuyerDto) {
    try {
      const hashedPassword = await this.$getHashedPassword(dto.password);
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          gender: dto.gender,
          dob: dto.dob,
          role: dto.role,
          buyer: {
            create: {
              walletAmount: dto.walletAmount
            }
          },
          addresses: {
            create: dto.addresses
          }
        },
        include: {
          addresses: true,
          buyer: true
        }
      });

      const { password, ...result } = user;
      return result;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(`User with this ${err.meta?.target?.[0]} already exists.`);
      }
      throw err;
    }
  }
  async createSeller(dto: CreateUserSellerDto) {
    try {
      const hashedPassword = await this.$getHashedPassword(dto.password);
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          gender: dto.gender,
          dob: dto.dob,
          role: dto.role,
          seller: {
            create: {
              businessId: dto.businessId,
              IBAN: dto.IBAN
            }
          },
          addresses: {
            create: dto.addresses
          }
        },
        include: {
          addresses: true,
          seller: true
        }
      });
      const { password, ...result } = user;
      return result;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code == "P2002") {
        throw new ConflictException(`User with this ${err.meta?.target?.[0]} already exists.`);
      }
    }
  }
  async createRider(dto: CreateUserRiderDto) {
    try {
      const hashedPassword = await this.$getHashedPassword(dto.password);
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          gender: dto.gender,
          dob: dto.dob,
          role: dto.role,
          rider: {
            create: {
              vehicleRegNo: dto.vehicleRegNo,
              companyPhone: dto.companyPhone
            }
          },
          addresses: {
            create: dto.addresses
          }
        },
        include: {
          addresses: true,
          rider: true
        }
      });
      const { password, ...result } = user;
      return result;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(`User with this ${err.meta?.target?.[0]} already exists.`);
      }
      throw err;
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
