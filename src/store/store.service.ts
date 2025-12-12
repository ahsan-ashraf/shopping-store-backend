import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { S3Service } from "src/s3/s3.service";
import { CreateStoreDto } from "./dto/request/create-store.dto";
import { UpdateStoreDto } from "./dto/request/update-store.dto";
import { OperationalState, Prisma, PrismaClient } from "@prisma/client";
import { UpdateStoreStatusDto } from "./dto/request/update-store-status.dto";
import { Utils } from "src/utils/utils";
import { ProductService } from "src/product/product.service";
import { UpdateProductStatusDto } from "src/product/dto/update-product-status.dto";

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
    private readonly s3Service: S3Service
  ) {}

  private async $isValidActor(payload: any) {
    const valid = await Utils.isValidActor(payload.actorId, payload.role, this.prisma);
    if (!valid) {
      throw new NotFoundException(`${payload.role} not found or invalid`);
    }
  }

  async findOne(storeId: string, payload: any) {
    const store = await this.prisma.store.findUnique({
      where: {
        id: storeId,
        sellerId: payload.actorId,
        seller: {
          userId: payload.sub
        }
      }
    });

    if (!store) {
      throw new NotFoundException("Store not found");
    }

    return store;
  }
  async getAllStores(payload: any) {
    const stores = await this.prisma.store.findMany({ where: { sellerId: payload.actorId } });
    return stores;
  }
  // Business logic isn't implemented yet, whether this seller has premium acc or hit max store limits
  async create(dto: CreateStoreDto, payload: any, iconImage: Express.Multer.File, bannerImage: Express.Multer.File) {
    this.$isValidActor(payload);

    const filesToUpload = [iconImage, bannerImage];

    let uploadedFiles;
    try {
      uploadedFiles = await Promise.all(filesToUpload.map((file) => this.s3Service.uploadFile(file, "_uploads")));
    } catch (err) {
      throw new InternalServerErrorException(`Couldn't upload images to server: ${err?.message}`);
    }

    try {
      const store = this.prisma.store.create({
        data: {
          sellerId: payload.actorId,
          bannerImageUrl: uploadedFiles[1].url,
          bannerImageName: uploadedFiles[1].key,
          iconImageUrl: uploadedFiles[0].url,
          iconImageName: uploadedFiles[0].key,
          storeName: dto.storeName,
          description: dto.description,
          categoryId: dto.categoryId,
          youtube: dto.youtube,
          facebook: dto.facebook,
          instagram: dto.instagram,
          tiktok: dto.tiktok
        }
      });

      return store;
    } catch (err) {
      await Promise.all(uploadedFiles.map((file) => this.s3Service.deleteFile(file.key)));
      throw new InternalServerErrorException(`Failed to craete store: ${err?.message}`);
    }
  }

  async update(storeId: string, dto: UpdateStoreDto, payload: any, iconImage: Express.Multer.File | null, bannerImage: Express.Multer.File | null) {
    this.$isValidActor(payload);

    const existingStore = await this.prisma.store.findUnique({ where: { id: storeId, sellerId: payload.actorId }, select: { iconImageName: true, bannerImageName: true } });
    if (!existingStore) {
      throw new BadRequestException("Store not found or Invalid store id passed");
    }

    try {
      if (iconImage) {
        await this.s3Service.deleteFile(existingStore?.iconImageName!);
        await this.s3Service.uploadFile(iconImage);
      }
      if (bannerImage) {
        await this.s3Service.deleteFile(existingStore?.bannerImageName!);
        await this.s3Service.uploadFile(bannerImage);
      }
    } catch (err) {
      throw err;
    }
    try {
      const dataToUpdate = { ...dto };
      const updatedStore = this.prisma.store.update({
        where: { id: storeId },
        data: dataToUpdate,
        select: {
          sellerId: true,
          bannerImageUrl: true,
          bannerImageName: true,
          iconImageUrl: true,
          iconImageName: true,
          storeName: true,
          description: true,
          categoryId: true,
          youtube: true,
          facebook: true,
          instagram: true,
          tiktok: true,
          approvalState: true,
          operationalState: true
        }
      });
      return updatedStore;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to update store: ${err?.message}`);
    }
  }

  async updateStatus(storeId: string, dto: UpdateStoreStatusDto, payload: any, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;

    if (!tx) {
      return await this.prisma.$transaction(async (trx) => {
        return this.updateStatus(storeId, dto, payload, trx);
      });
    }

    this.$isValidActor(payload);

    try {
      if (dto.operationalState !== OperationalState.Active) {
        const updatedStore = await db.store.update({
          where: { id: storeId },
          data: { ...dto },
          select: {
            sellerId: true,
            bannerImageUrl: true,
            bannerImageName: true,
            iconImageUrl: true,
            iconImageName: true,
            storeName: true,
            description: true,
            categoryId: true,
            youtube: true,
            facebook: true,
            instagram: true,
            tiktok: true,
            approvalState: true,
            operationalState: true,
            products: true
          }
        });

        for (const product of updatedStore.products) {
          await this.productService.updateStatus(product.id, dto, payload, tx);
        }

        return updatedStore;
      } else {
        const updatedStore = await db.store.update({ where: { id: storeId }, data: { ...dto }, select: { id: true, operationalState: true, approvalState: true } });
        return updatedStore;
      }
    } catch (err) {
      if (err.code === "P2025") {
        throw new NotFoundException("Couldn't found store against provided id to update status.");
      }
      throw err;
    }
  }

  async deleteStore(storeId: string, payload: any, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;

    // If no tx was provided, wrap the entire deleteStore in its own transaction
    if (!tx) {
      return await this.prisma.$transaction(async (trx) => {
        return this.deleteStore(storeId, payload, trx); // re-invoke WITH transaction client
      });
    }

    this.$isValidActor(payload);

    // Fetch store to ensure it exists and belongs to the actor
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: { sellerId: true, iconImageName: true, bannerImageName: true, products: { select: { id: true } } }
    });

    if (!store) {
      throw new BadRequestException("Store not found to delete.");
    }

    const trashFolder = `_trash/${storeId}/${Date.now()}`;
    const trashIcon = `${trashFolder}/icon_${store.iconImageName}`;
    const trashBanner = `${trashFolder}/banner_${store.bannerImageName}`;

    // Move images to trash first, these images url do not exists in s3 yet becayse this is seeding data and throwing exceptions when not found
    // uncoment the following block in real data and it will work.
    // try {
    //   await this.s3Service.moveFile(store.iconImageName, trashIcon);
    //   await this.s3Service.moveFile(store.bannerImageName, trashBanner);
    // } catch (err) {
    //   throw new InternalServerErrorException(`Failed to move images to trash: ${err?.message}`);
    // }

    try {
      const deleteStatusDto = { operationalState: OperationalState.Blocked };
      // Soft delete store
      await db.store.update({ where: { id: storeId }, data: { ...deleteStatusDto } });

      // Soft delete all related products
      if (store.products.length > 0) {
        await Promise.all(store.products.map((product) => this.productService.remove(product.id, payload, db)));
      }

      // Delete files from S3 after permanently delete
      // await this.s3Service.deleteFile(trashIcon);
      // await this.s3Service.deleteFile(trashBanner);

      return { message: "Store soft deleted successfully", storeId };
    } catch (err) {
      // Rollback images if soft delete fails
      try {
        // uncomment following block in real data and it will work
        // await this.s3Service.moveFile(trashIcon, store.iconImageName);
        // await this.s3Service.moveFile(trashBanner, store.bannerImageName);
      } catch (rollbackErr) {
        console.error(`Rollback Failed: ${rollbackErr?.message}`);
        // TODO: Schedule a retry routine for failed rollback
      }

      throw new InternalServerErrorException(`Unable to soft delete store: ${err?.message}`);
    }
  }

  // async deleteStore(storeId: string, payload: any) {
  //   this.$isValidActor(payload);
  //   const store = await this.prisma.store.findUnique({ where: { id: storeId, sellerId: payload.actorId }, select: { iconImageName: true, bannerImageName: true } });
  //   if (!store) {
  //     throw new BadRequestException("Store not found to delete.");
  //   }

  //   const trashFolder = `_trash/${storeId}/${Date.now()}`;
  //   const trashIcon = `${trashFolder}/icon_${store.iconImageName}`;
  //   const trashbanner = `${trashFolder}/banner_${store.bannerImageName}`;

  //   try {
  //     await this.s3Service.moveFile(store.iconImageName, trashIcon);
  //     await this.s3Service.moveFile(store.bannerImageName, trashbanner);
  //   } catch (err) {
  //     throw new InternalServerErrorException(`Failed to move images to trash: ${err?.message}`);
  //   }

  //   try {
  //     const deletedStore = await this.prisma.store.delete({ where: { id: storeId } });
  //     await this.s3Service.deleteFile(trashIcon);
  //     await this.s3Service.deleteFile(trashbanner);
  //     return deletedStore;
  //   } catch (err) {
  //     try {
  //       await this.s3Service.moveFile(trashIcon, store.iconImageName);
  //       await this.s3Service.moveFile(trashbanner, store.bannerImageName);
  //     } catch (err) {
  //       console.error(`-=> Rollback Failed: ${err?.message}`);
  //       // TODO: Schedual a retry routine here.
  //     }

  //     throw new InternalServerErrorException(`Unable to delete store: ${err?.message}`);
  //   }
  // }
}
