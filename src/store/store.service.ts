import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { S3Service } from "src/s3/s3.service";
import { CreateStoreDto } from "./dto/create-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service
  ) {}

  async get(storeId: string) {
    // validate users first via ids in jwt tokens
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    return store;
  }
  // Business logic isn't implemented yet, as we're not checking whether the seller id is valid/exists or and
  // whether this seller has premium acc or hit max store limits and we are also not checking ids from tokens yet
  async create(dto: CreateStoreDto, iconImage: Express.Multer.File, bannerImage: Express.Multer.File) {
    const filesToUpload = [iconImage, bannerImage];
    const uploadedFiles = await Promise.all(filesToUpload.map((file) => this.s3Service.uploadFile(file, "_uploads")));

    try {
      const store = this.prisma.store.create({
        data: {
          sellerId: dto.sellerId,
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

  async update(storeId: string, dto: UpdateStoreDto, iconImage: Express.Multer.File | null, bannerImage: Express.Multer.File | null) {
    // extract seller id and user id from jwt token
    // check if the seller id is valid
    // check if store id is valid and belongs to the this user seller who is requesting to update

    const existingStore = await this.prisma.store.findUnique({ where: { id: storeId }, select: { iconImageName: true, bannerImageName: true } });
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
          tiktok: true
        }
      });
      return updatedStore;
    } catch (err) {
      throw new InternalServerErrorException(`Failed to update store: ${err?.message}`);
    }
  }

  async deleteStore(storeId: string) {
    // get seller id and user id from jwt tokens to validate user and seller
    // validate store id i.e. it should belongs to the valid seller
    // delete store images from s3 and then delete store
    // if store deletion failed then re-upload the deleted images to s3

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { iconImageName: true, bannerImageName: true } });
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
