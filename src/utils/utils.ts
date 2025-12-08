import { Role } from "@prisma/client";
import { PrismaService } from "prisma/prisma.service";

export class Utils {
  public static async isValidActor(actorId: string, role: Role, prisma: PrismaService): Promise<boolean> {
    let result: boolean = false;
    if (role === Role.Admin || role === Role.SuperAdmin) {
      const user = await prisma.user.findFirst({ where: { id: actorId, role } });
      result = !!user;
    } else if (role === Role.Buyer) {
      const user = await prisma.buyer.findUnique({ where: { id: actorId } });
      result = !!user;
    } else if (role === Role.Seller) {
      const user = await prisma.seller.findUnique({ where: { id: actorId } });
      result = !!user;
    } else if (role === Role.Rider) {
      const user = await prisma.rider.findUnique({ where: { id: actorId } });
      result = !!user;
    }
    return result;
  }
}
