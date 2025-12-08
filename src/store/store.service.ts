import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { S3Service } from "src/s3/s3.service";
import { CreateStoreDto } from "./dto/request/create-store.dto";
import { UpdateStoreDto } from "./dto/request/update-store.dto";
import { Role } from "@prisma/client";
import { UpdateStoreStatusDto } from "./dto/request/update-store-status.dto";
import { Utils } from "src/utils/utils";

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
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
          status: true
        }
      });
      return updatedStore;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to update store: ${err?.message}`);
    }
  }

  async updateStatus(storeId: string, dto: UpdateStoreStatusDto, payload: any) {
    this.$isValidActor(payload);
    const store = await this.prisma.store.findFirst({ where: { id: storeId, sellerId: payload.actorId } });
    if (!store) {
      throw new BadRequestException("Store not found or Invalid store id to update status");
    }

    try {
      const updatedStore = await this.prisma.store.update({
        where: { id: store.id },
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
          status: true
        }
      });
      return updatedStore;
    } catch (err) {
      throw new InternalServerErrorException("Failed to update store status");
    }
  }

  async deleteStore(storeId: string, payload: any) {
    this.$isValidActor(payload);
    const store = await this.prisma.store.findUnique({ where: { id: storeId, sellerId: payload.actorId }, select: { iconImageName: true, bannerImageName: true } });
    if (!store) {
      throw new BadRequestException("Store not found to delete.");
    }

    const trashFolder = `_trash/${storeId}/${Date.now()}`;
    const trashIcon = `${trashFolder}/icon_${store.iconImageName}`;
    const trashbanner = `${trashFolder}/banner_${store.bannerImageName}`;

    try {
      await this.s3Service.moveFile(store.iconImageName, trashIcon);
      await this.s3Service.moveFile(store.bannerImageName, trashbanner);
    } catch (err) {
      throw new InternalServerErrorException(`Failed to move images to trash: ${err?.message}`);
    }

    try {
      const deletedStore = await this.prisma.store.delete({ where: { id: storeId } });
      await this.s3Service.deleteFile(trashIcon);
      await this.s3Service.deleteFile(trashbanner);
      return deletedStore;
    } catch (err) {
      try {
        await this.s3Service.moveFile(trashIcon, store.iconImageName);
        await this.s3Service.moveFile(trashbanner, store.bannerImageName);
      } catch (err) {
        console.error(`-=> Rollback Failed: ${err?.message}`);
        // TODO: Schedual a retry routine here.
      }

      throw new InternalServerErrorException(`Unable to delete store: ${err?.message}`);
    }
  }
}
