import { Injectable } from "@nestjs/common";
import { ApprovalState, OperationalState, OrderStatus, PaymentStatus, ReturnRequestStatus, Role } from "@prisma/client";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async getAverageRating(): Promise<number> {
    const storeAverages = await this.prisma.product.groupBy({
      by: ["storeId"],
      where: { rating: { gt: 0 } },
      _avg: { rating: true }
    });

    const platformAverage =
      storeAverages.reduce((acc, store) => {
        const avgRating = store._avg.rating ? Number(store._avg.rating) : 0;
        return acc + avgRating;
      }, 0) / storeAverages.length;

    return platformAverage;
  }
  private async getTotalCanceledOrders(): Promise<number> {
    return await this.prisma.order.count({ where: { status: OrderStatus.Canceled } });
  }
  private async getTotalStore(): Promise<number> {
    return await this.prisma.store.count();
  }
  private async getTotalBuyers(): Promise<number> {
    return await this.prisma.buyer.count();
  }
  private async getTotalRiders(): Promise<number> {
    return await this.prisma.rider.count();
  }
  private async getTotalSellers(): Promise<number> {
    return await this.prisma.seller.count();
  }
  private async getTotalOrders(): Promise<number> {
    return await this.prisma.order.count();
  }
  private async getTotalReturnRequests(): Promise<number> {
    return await this.prisma.returnRequest.count({ where: { status: ReturnRequestStatus.Returned } });
  }
  private async getTotalFailedToDeliver(): Promise<number> {
    return await this.prisma.order.count({ where: { status: OrderStatus.FailedToDeliver } });
  }
  private async getTotalRevenue(): Promise<number> {
    const result = await this.prisma.orderItem.findMany({
      where: {
        order: {
          status: OrderStatus.Delivered
        }
      },
      select: {
        qty: true,
        priceAtPurchase: true,
        salePriceAtPurchase: true,
        order: {
          select: {
            status: true
          }
        }
      }
    });

    const totalRevenue = result.reduce((sum, item) => {
      const unitPrice = item.salePriceAtPurchase ? item.salePriceAtPurchase : item.priceAtPurchase;
      return sum + Number(unitPrice) * item.qty;
    }, 0);

    return totalRevenue;
  }

  async getHighlights() {
    const totalOrders = await this.getTotalOrders();
    const averageRating = await this.getAverageRating();
    const totalCanceled = await this.getTotalCanceledOrders();
    const totalStores = await this.getTotalStore();
    const totalBuyers = await this.getTotalBuyers();
    const totalRiders = await this.getTotalRiders();
    const totalSellers = await this.getTotalSellers();
    const totalReturned = await this.getTotalReturnRequests();
    const totalFailed = await this.getTotalFailedToDeliver();
    const totalRevenue = await this.getTotalRevenue();

    return { averageRating, totalStores, totalBuyers, totalRiders, totalSellers, totalOrders, totalCanceled, totalReturned, totalFailed, totalRevenue };
  }

  async getRecentOrders(active: boolean, pageNo: number = 1, pageSize: number = 10) {
    const activeStatuses = [OrderStatus.Processing, OrderStatus.OutForDeliver];
    const nonActiveStatuses = [OrderStatus.Canceled, OrderStatus.Delivered, OrderStatus.FailedToDeliver];
    const statuses = active ? activeStatuses : nonActiveStatuses;

    const skip = (pageNo - 1) * pageSize;

    const recentOrders = await this.prisma.order.findMany({
      where: { status: { in: statuses } },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        status: true,
        createdAt: true,
        rider: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        buyer: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        orderItems: {
          select: {
            priceAtPurchase: true,
            salePriceAtPurchase: true,
            qty: true
          }
        }
      }
    });

    const mappedOrders = recentOrders.map((order, _) => ({
      id: order.id,
      buyerName: order.buyer?.user.name,
      riderName: order.rider?.user.name,
      status: order.status,
      totalPrice: order.orderItems.reduce((sum, item) => {
        const salePrice = Number(item.salePriceAtPurchase);
        const purchasePrice = Number(item.priceAtPurchase);
        const unitPrice = salePrice > 0 ? salePrice : purchasePrice;

        return sum + item.qty * unitPrice;
      }, 0),
      createdAt: order.createdAt
    }));

    return {
      data: mappedOrders,
      pageNo,
      pageSize,
      totalCount: mappedOrders.length,
      totalPages: Math.ceil(mappedOrders.length / pageSize)
    };
  }

  async getStoresInfo(pageNo: number = 1, pageSize: number = 10) {
    const skip = (pageNo - 1) * pageSize;
    const storesData = await this.prisma.store.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        storeName: true,
        seller: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        products: {
          select: {
            productReviews: {
              select: {
                rating: true
              }
            },
            orderItems: {
              select: {
                order: {
                  select: {
                    id: true,
                    status: true
                  }
                }
              }
            },
            returnRequests: {
              select: {
                id: true
              }
            }
          }
        },

        createdAt: true,
        operationalState: true,
        approvalState: true,
        updatedAt: true
      }
    });

    const data = storesData.map((store, _) => {
      const allRatings = store.products.flatMap((p) => p.productReviews.map((r) => Number(r.rating)));
      const averageRating = allRatings.length ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length : 0;

      const completedOrders = new Set(
        store.products
          .flatMap((p) => p.orderItems)
          .filter((oi) => oi.order.status === OrderStatus.Delivered)
          .map((oi) => oi.order.id)
      ).size;

      const canceledOrders = new Set(
        store.products
          .flatMap((p) => p.orderItems)
          .filter((oi) => oi.order.status === OrderStatus.Canceled)
          .map((oi) => oi.order.id)
      ).size;

      const returnRequests = store.products.reduce((sum, p) => sum + p.returnRequests.length, 0);

      return {
        id: store.id,
        storeName: store.storeName,
        sellerName: store.seller.user.name,
        createdAt: store.createdAt,
        operationalState: store.operationalState,
        approvalState: store.approvalState,
        averageRating,
        completedOrders,
        canceledOrders,
        returnRequests
      };
    });

    return {
      data,
      pageNo,
      pageSize,
      totalStores: data.length,
      totalPages: Math.ceil(data.length / pageSize)
    };
  }

  async getSellersInfo(operationalState: OperationalState = OperationalState.Active, pageNo: number = 1, pageSize: number = 10) {
    const skip = (pageNo - 1) * pageSize;

    const sellersData = await this.prisma.seller.findMany({
      skip,
      take: pageSize,
      where: { user: { operationalState } },
      select: {
        id: true,
        user: { select: { name: true, createdAt: true, operationalState: true } },
        stores: {
          select: {
            id: true,
            products: {
              select: {
                productReviews: { select: { rating: true } },
                orderItems: {
                  select: {
                    qty: true,
                    priceAtPurchase: true,
                    salePriceAtPurchase: true,
                    order: { select: { id: true, status: true } }
                  }
                },
                returnRequests: { select: { id: true } }
              }
            }
          }
        }
      }
    });

    const sellerStats = sellersData.map((seller) => {
      const allProducts = seller.stores.flatMap((store) => store.products);

      const totalStores = seller.stores.length;
      const completedOrders = new Set(
        allProducts
          .flatMap((p) => p.orderItems)
          .filter((oi) => oi.order?.status === OrderStatus.Delivered)
          .map((oi) => oi.order.id)
      ).size;

      const canceledOrders = new Set(
        allProducts
          .flatMap((p) => p.orderItems)
          .filter((oi) => oi.order?.status === OrderStatus.Canceled)
          .map((oi) => oi.order.id)
      ).size;

      const returnRequests = allProducts.reduce((sum, p) => sum + p.returnRequests.length, 0);

      const allRatings = allProducts.flatMap((p) => p.productReviews.map((pr) => Number(pr.rating)));
      const averageRating = allRatings ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length : 0;

      return {
        id: seller.id,
        totalStores,
        averageRating,
        sellerName: seller.user.name,
        completedOrders,
        canceledOrders,
        returnedOrders: returnRequests,
        operationalState: seller.user.operationalState,
        approvalState: seller.user.operationalState,
        createdAt: seller.user.createdAt
      };
    });

    return {
      data: sellerStats,
      pageNo,
      pageSize,
      totalSellers: sellerStats.length,
      totalPages: Math.ceil(sellerStats.length / pageSize)
    };
  }

  async getBuyersInfo(operationalState: OperationalState = OperationalState.Active, pageNo: number = 1, pageSize: number = 10) {
    const skip = (pageNo - 1) * pageSize;

    const buyersData = await this.prisma.buyer.findMany({
      skip,
      take: pageSize,
      orderBy: { user: { createdAt: "desc" } },
      where: { user: { operationalState } },
      select: {
        id: true,
        user: { select: { name: true, operationalState: true, approvalState: true, createdAt: true } },
        orders: true,
        returnRequests: true
      }
    });

    const buyersStats = buyersData.map((buyer) => {
      const totalOrders = buyer.orders.filter((o) => o.status === OrderStatus.Delivered).length;
      const totalCanceled = buyer.orders.filter((o) => o.status === OrderStatus.Canceled).length;
      const totalReturned = buyer.returnRequests.length;

      return {
        id: buyer.id,
        name: buyer.user.name,
        operationalState: buyer.user.operationalState,
        approvalState: buyer.user.approvalState,
        createdAt: buyer.user.createdAt,
        totalOrders,
        totalCanceled,
        totalReturned
      };
    });

    return {
      data: buyersStats,
      pageNo,
      pageSize,
      totalBuyers: buyersStats.length,
      totalPages: Math.ceil(buyersStats.length / pageSize)
    };
  }

  async getRidersInfo(operationalState: OperationalState = OperationalState.Active, pageNo: number = 1, pageSize: number = 10) {
    const skip = (pageNo - 1) * pageSize;
    const ridersData = await this.prisma.rider.findMany({
      skip,
      take: pageSize,
      where: { user: { operationalState } },
      select: {
        id: true,
        user: { select: { name: true, operationalState: true, approvalState: true, createdAt: true } },
        amountToRecieve: true,
        orders: true,
        returnRequests: true
      }
    });

    const ridersInfo = ridersData.map((rider) => {
      const totalDeliveries = rider.orders.filter((o) => o.status === OrderStatus.Delivered).length;
      const totalFailures = rider.orders.filter((o) => o.status === OrderStatus.FailedToDeliver).length;
      const totalReturns = rider.returnRequests.filter((rr) => rr.status === ReturnRequestStatus.Returned).length;

      return {
        id: rider.id,
        name: rider.user.name,
        operationalState: rider.user.operationalState,
        approvalState: rider.user.approvalState,
        createdAt: rider.user.createdAt,
        amountToRecieve: rider.amountToRecieve,
        totalDeliveries,
        totalFailures,
        totalReturns
      };
    });

    return {
      data: ridersInfo,
      pageNo,
      pageSize,
      totalRiders: ridersInfo.length,
      totalPages: Math.ceil(ridersInfo.length / pageSize)
    };
  }

  async getAdminsInfo(operationalState: OperationalState = OperationalState.Active, pageNo: number = 1, pageSize: number = 10) {
    const skip = (pageNo - 1) * pageSize;
    const adminsData = await this.prisma.user.findMany({
      skip,
      take: pageSize,
      where: {
        operationalState,
        role: Role.Admin
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        operationalState: true,
        approvalState: true
      }
    });

    return {
      data: adminsData,
      pageNo,
      pageSize,
      totalAdmins: adminsData.length,
      totalPages: adminsData.length / pageSize
    };
  }
}
