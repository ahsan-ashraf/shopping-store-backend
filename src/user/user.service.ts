import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { UpdateUserStatusDto } from "./dto/request/update-user-status.dto";
import { Utils } from "src/utils/utils";
import { StoreService } from "src/store/store.service";
import { OperationalState, Role } from "@prisma/client";

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoreService
  ) {}

  private async $isValidActor(payload: any) {
    const valid = await Utils.isValidActor(payload.actorId, payload.role, this.prisma);
    if (!valid) {
      throw new NotFoundException(`${payload.role} not found or invalid`);
    }
  }

  private async $isUserAlreadyDeleted(userId: string): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      throw new NotFoundException("User not found.");
    }
    // check if user is already deleted
    return existingUser.operationalState === OperationalState.Blocked;
  }

  async getProfile(userId: string, payload: any) {
    await this.$isValidActor(payload);

    const userProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        dob: true,
        gender: true,
        role: true,
        addresses: {
          select: {
            address: true,
            city: true,
            province: true,
            postalCode: true,
            isPrimary: true,
            phone: true
          }
        },
        buyer: {
          select: {
            walletAmount: true
          }
        },
        rider: {
          select: {
            vehicleRegNo: true,
            companyPhone: true
          }
        },
        seller: {
          select: {
            businessId: true,
            IBAN: true,
            stores: {
              select: {
                id: true,
                storeName: true,
                iconImageUrl: true
              }
            }
          }
        }
      }
    });
    if (!userProfile) {
      throw new NotFoundException("No user profile found agains the provided id");
    }
    return userProfile;
  }
  async updateStatus(userId: string, dto: UpdateUserStatusDto, payload: any) {
    await this.$isValidActor(payload);

    if (await this.$isUserAlreadyDeleted(userId)) {
      throw new BadRequestException("Can't update status of a deleted user");
    }

    try {
      if (dto.operationalState !== OperationalState.Active) {
        return await this.prisma.$transaction(async (tx) => {
          const updatedUser = await tx.user.update({ where: { id: userId }, data: { ...dto }, select: { role: true, approvalState: true, operationalState: true } });

          if (updatedUser.role === Role.Seller) {
            const seller = await tx.seller.findUnique({ where: { userId }, select: { stores: { select: { id: true, products: true } } } });

            if (seller && seller.stores?.length) {
              for (const store of seller.stores) {
                await this.storeService.updateStatus(store.id, dto, payload, tx);
              }
            }
          } else if (updatedUser.role === Role.Rider) {
            //TODO: shift its pending deliveries and return requests to some other buyer.
          }
          return updatedUser;
        });
      } else {
        const updatedUser = await this.prisma.user.update({ where: { id: userId }, data: { ...dto }, select: { id: true, role: true, approvalState: true, operationalState: true } });
        return updatedUser;
      }
    } catch (err) {
      if (err.code === "P2025") {
        throw new NotFoundException("Couldn't found user agains the provided id to update");
      }
      throw err;
    }
  }

  async deleteUser(userId: string, payload: any) {
    return await this.prisma.$transaction(async (tx) => {
      await this.$isValidActor(payload);

      if (await this.$isUserAlreadyDeleted(userId)) {
        throw new BadRequestException("User Already Deleted");
      }

      const deleteStatusDto = { operationalState: OperationalState.Blocked };

      // it will soft delete all users i.e. admin, superadmin, seller, buyer, rider
      const deletedUser = await tx.user.update({ where: { id: userId }, data: { ...deleteStatusDto }, select: { role: true } });
      if (deletedUser.role === "Seller") {
        const seller = await tx.seller.findUnique({ where: { userId }, include: { stores: { include: { products: true } } } });
        if (seller && seller.stores?.length) {
          for (const store of seller.stores) {
            await this.storeService.deleteStore(store.id, payload, tx);
          }
        }
      } else if (deletedUser.role === "Buyer") {
        const buyer = await tx.buyer.findUnique({ where: { userId } });
        if (buyer) {
          await tx.cart.deleteMany({ where: { buyerId: buyer.id } });
          await tx.wishlist.deleteMany({ where: { buyerId: buyer.id } });
          await tx.order.updateMany({ where: { buyerId: buyer.id }, data: { ...deleteStatusDto } });
          await tx.returnRequest.updateMany({ where: { buyerId: buyer.id }, data: { ...deleteStatusDto } });
          await tx.productReview.updateMany({ where: { buyerId: buyer.id }, data: { ...deleteStatusDto } });
        }
      } else if (deletedUser.role === "Rider") {
        // const rider = await this.prisma.rider.findUnique({ where: { userId } });
        // if (rider) {}
        // nothing to soft delete for rider
      }

      return { message: "User deleted successfully", data: deletedUser, success: true };
    });
  }
}
