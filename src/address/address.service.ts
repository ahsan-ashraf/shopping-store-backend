import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { PrismaService } from "prisma/prisma.service";
import { Role } from "../types";
import { PrismaClientKnownRequestError } from "generated/prisma/internal/prismaNamespace";

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!existingUser) {
      throw new NotFoundException("User not Found");
    }
    if (existingUser.role !== Role.Buyer) {
      throw new BadRequestException("User is not Buyer");
    }

    const address = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.address.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false }
        });
      }

      return tx.address.create({
        data: {
          userId,
          address: dto.address,
          city: dto.city,
          phone: dto.phone,
          province: dto.province,
          postalCode: dto.postalCode,
          isPrimary: dto.isPrimary
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              gender: true,
              dob: true,
              role: true,
              createdAt: true,
              updatedAt: true,
              status: true
            }
          }
        }
      });
    });

    const { user, ...rest } = address;

    return address;
  }

  async findAll() {
    const allAddress = await this.prisma.address.findMany();
    return allAddress;
  }
  async findAllAddressWithUserId(userId: string) {
    const allAddressOfUser = await this.prisma.address.findMany({ where: { userId } });
    return allAddressOfUser;
  }

  async findOne(id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) {
      throw new NotFoundException(`No address found against the id ${id}`);
    }
    return address;
  }

  async update(id: string, dto: UpdateAddressDto) {
    const addressToUpdate = await this.prisma.address.findUnique({ where: { id } });
    if (!addressToUpdate) {
      throw new NotFoundException(`No address found against the id ${id} to update`);
    }

    const updatedAddress = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.address.updateMany({
          where: { userId: addressToUpdate.userId, isPrimary: true },
          data: { isPrimary: false }
        });
      }
      const dataToUpdate = { ...dto };
      return tx.address.update({
        where: { id },
        data: dataToUpdate,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              gender: true,
              dob: true,
              role: true,
              createdAt: true,
              updatedAt: true,
              status: true
            }
          }
        }
      });
    });
    return updatedAddress;
  }

  async remove(id: string) {
    const removedAddress = await this.prisma.$transaction(async (tx) => {
      const addressToDelete = await tx.address.findUnique({ where: { id }, include: { user: true } });

      if (!addressToDelete) {
        throw new NotFoundException(`Address with id ${id} not found`);
      }

      const addressCount = await tx.address.count({ where: { userId: addressToDelete.userId } });
      if (addressCount <= 1) {
        throw new BadRequestException("Can't delete the only address, user must have at least one address");
      }

      const deletedAddress = await tx.address.delete({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              gender: true,
              dob: true,
              role: true,
              createdAt: true,
              updatedAt: true,
              status: true
            }
          }
        }
      });

      if (deletedAddress.isPrimary) {
        const otherAddress = await tx.address.findFirst({
          where: { userId: addressToDelete.userId },
          orderBy: { createdAt: "asc" }
        });
        if (otherAddress) {
          await tx.address.update({
            where: { id: otherAddress.id },
            data: { isPrimary: true }
          });
        }
      }
      return deletedAddress;
    });

    return removedAddress;
  }
}
