import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { UpdateUserStatusDto } from "./dto/request/update-user-status.dto";
import { Utils } from "src/utils/utils";
import { UserStatus } from "@prisma/client";
import { StoreService } from "src/store/store.service";

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
    return existingUser.status === UserStatus.Deleted;
  }

  async updateStatus(userId: string, dto: UpdateUserStatusDto, payload: any) {
    this.$isValidActor(payload);

    if (await this.$isUserAlreadyDeleted(userId)) {
      throw new BadRequestException("Can't update status of a deleted user");
    }

    const updatedUser = await this.prisma.user.update({ where: { id: userId }, data: { ...dto } });
    return updatedUser;
  }

  async deleteUser(userId: string, payload: any) {
    this.$isValidActor(payload);

    if (await this.$isUserAlreadyDeleted(userId)) {
      throw new BadRequestException("User Already Deleted");
    }

    const deleteStatusDto = {
      status: UserStatus.Deleted
    };

    // it will soft delete all users i.e. admin, superadmin, seller, buyer, rider
    const deletedUser = await this.prisma.user.update({ where: { id: userId }, data: { ...deleteStatusDto }, select: { role: true } });

    if (deletedUser.role === "Seller") {
      const seller = await this.prisma.seller.findUnique({ where: { userId }, include: { stores: { include: { products: true } } } });
      if (seller && seller.stores.length) {
        await Promise.all(seller.stores.map((store) => this.storeService.deleteStore(store.id, payload)));
      }
    } else if (deletedUser.role === "Buyer") {
      const buyer = await this.prisma.buyer.findUnique({
        where: { userId }
      });
      if (buyer) {
        await Promise.all([
          this.prisma.cart.deleteMany({ where: { buyerId: buyer.id } }),
          this.prisma.wishlist.deleteMany({ where: { buyerId: buyer.id } }),
          this.prisma.order.updateMany({ where: { buyerId: buyer.id }, data: { ...deleteStatusDto } }),
          this.prisma.returnRequest.updateMany({ where: { buyerId: buyer.id }, data: { ...deleteStatusDto } }),
          this.prisma.productReview.updateMany({ where: { buyerId: buyer.id }, data: { ...deleteStatusDto } })
        ]);
      }
    } else if (deletedUser.role === "Rider") {
      // const rider = await this.prisma.rider.findUnique({ where: { userId } });
      // if (rider){}
      // nothing to soft delete for rider
    }

    return deletedUser;
  }
}
