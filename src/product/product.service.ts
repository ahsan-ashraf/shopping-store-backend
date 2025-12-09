import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { PrismaService } from "prisma/prisma.service";
import { S3Service } from "src/s3/s3.service";
import { Prisma, UserStatus } from "@prisma/client";
import { Utils } from "src/utils/utils";

@Injectable()
export class ProductService {
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

  async create(storeId: string, dto: CreateProductDto, payload: any, images: Express.Multer.File[], video: Express.Multer.File | null) {
    this.$isValidActor(payload);

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new BadRequestException("Store Not Found");
    }

    let uploadedImages;
    try {
      uploadedImages = await Promise.all(images.map((image) => this.s3Service.uploadFile(image, "_uploads")));
    } catch (err) {
      throw new InternalServerErrorException(`Couldn't upload images: ${err?.message}`);
    }
    let uploadedVideo;
    try {
      if (video) {
        uploadedVideo = await this.s3Service.uploadFile(video, "_uploads");
      } else {
        uploadedVideo = null;
      }
    } catch (err) {
      throw new InternalServerErrorException(`Couldn't upload video: ${err?.message}`);
    }

    try {
      const addedProduct = await this.prisma.product.create({
        data: {
          storeId,
          stock: dto.stock,
          title: dto.title,
          description: dto.description,
          brand: dto.brand,
          color: dto.color,
          size: dto.size,
          tags: dto.tags,
          returnPolicy: dto.returnPolicy,
          warranty: dto.warranty,
          rating: new Prisma.Decimal(0),
          price: dto.price,
          salePrice: dto.salePrice ?? undefined,
          saleExpiresAt: dto.salePrice ? dto.saleExpiresAt : undefined,
          video: uploadedVideo?.key ?? undefined,
          images: uploadedImages.map((image) => image.key)
        }
      });
      return addedProduct;
    } catch (err) {
      if (uploadedVideo) await this.s3Service.deleteFile(uploadedVideo.key);
      await Promise.all(uploadedImages.map((image) => this.s3Service.deleteFile(image.key)));
      throw new InternalServerErrorException(`Couldn't add product: ${err?.message}`);
    }
  }

  async findAll(storeId: string, payload: any) {
    this.$isValidActor(payload);

    try {
      const storeExists = await this.prisma.store.count({ where: { id: storeId } });
      if (!storeExists) {
        throw new BadRequestException("Store Not Found.");
      }

      const allProducts = await this.prisma.product.findMany({ where: { storeId } });
      return allProducts;
    } catch (err) {
      throw new InternalServerErrorException(`Couldn't retrieve products: ${err?.message}`);
    }
  }

  async findOne(id: string, payload: any) {
    this.$isValidActor(payload);
    try {
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) {
        throw new BadRequestException("No Product Found.");
      }
      return product;
    } catch (err) {
      throw new InternalServerErrorException(`Could retrieve product: ${err?.message}`);
    }
  }

  async update(id: string, dto: UpdateProductDto, payload: any, images: Express.Multer.File[] | null, video: Express.Multer.File | null) {
    this.$isValidActor(payload);

    const product = await this.prisma.product.findUnique({ where: { id }, select: { images: true, video: true } });

    if (!product) throw new BadRequestException("Product not found");

    const trashFolder = `_trash/${Date.now()}`;
    let uploadedVideo: { key: string; url: string } | null = null;
    let uploadedImages: { key: string; url: string }[] = [];

    if (video) {
      const trashVideo = `${trashFolder}/video_${product.video}`;

      try {
        if (product.video) await this.s3Service.moveFile(product.video, trashVideo);
      } catch (err) {
        throw new InternalServerErrorException(`Failed to move old video to trash: ${err?.message}`);
      }

      try {
        uploadedVideo = await this.s3Service.uploadFile(video);
      } catch (err) {
        if (product.video) {
          await this.s3Service.moveFile(trashVideo, product.video).catch(() => {
            console.error("Rollback failed, schedual a retry routine here.");
          });
        }
        throw new InternalServerErrorException(`Failed to upload new video: ${err?.message}`);
      }
    }

    if (images && images.length > 0) {
      const trashImages = product.images.map((img) => `${trashFolder}/image_${img}`);

      try {
        await Promise.all(product.images.map((img, i) => this.s3Service.moveFile(img, trashImages[i])));
      } catch (err) {
        if (uploadedVideo) {
          await this.s3Service.deleteFile(uploadedVideo.key).catch(() => {
            console.error("Failed to delete uploaded video, schedual a retry routine here.");
          });
          if (product.video) {
            await this.s3Service.moveFile(`${trashFolder}/video_${product.video}`, product.video).catch(() => {
              console.error("Rollback failed, schedual a retry routine here.");
            });
          }
        }
        throw new InternalServerErrorException(`Failed to move old images to trash: ${err?.message}`);
      }

      try {
        uploadedImages = await Promise.all(images.map((file) => this.s3Service.uploadFile(file)));
      } catch (err) {
        if (uploadedVideo) {
          await this.s3Service.deleteFile(uploadedVideo.key).catch(() => {
            console.error("Failed to delete uploaded video, schedual a retry routine here.");
          });
          if (product.video) {
            await this.s3Service.moveFile(`${trashFolder}/video_${product.video}`, product.video).catch(() => {
              console.error("Rollback failed, schedual a retry routine here.");
            });
          }
        }
        await Promise.all(
          trashImages.map((img, i) =>
            this.s3Service.moveFile(img, product.images[i]).catch(() => {
              console.error("Rollback failed, schedual a retry routine here.");
            })
          )
        );
        throw new InternalServerErrorException(`Failed to upload new images: ${err?.message}`);
      }
    }

    const dataToUpdate: any = { ...dto };
    if (uploadedVideo) dataToUpdate.video = uploadedVideo.key;
    if (uploadedImages.length) dataToUpdate.images = uploadedImages.map((img) => img.key);

    let updatedProduct;
    try {
      updatedProduct = await this.prisma.product.update({
        where: { id },
        data: dataToUpdate
      });
    } catch (err) {
      if (uploadedVideo) {
        await this.s3Service.deleteFile(uploadedVideo.key).catch(() => {
          console.error("Failed to delete uploaded video, schedual a retry routine here.");
        });
        if (product.video) {
          await this.s3Service.moveFile(`${trashFolder}/video_${product.video}`, product.video).catch(() => {
            console.error("Rollback failed, schedual a retry routine here.");
          });
        }
      }
      if (uploadedImages.length) {
        await Promise.all(
          uploadedImages.map((img) =>
            this.s3Service.deleteFile(img.key).catch(() => {
              console.error("Failed to delete uploaded images, schedual a retry routine here.");
            })
          )
        );
        await Promise.all(
          product.images.map((img, i) =>
            this.s3Service.moveFile(`${trashFolder}/image_${img}`, img).catch(() => {
              console.error("Rollback failed, schedual a retry routine here.");
            })
          )
        );
      }
      throw new InternalServerErrorException(`Failed to update product in DB: ${err?.message}`);
    }

    try {
      if (uploadedVideo) await this.s3Service.deleteFile(`${trashFolder}/video_${product.video}`);
      if (uploadedImages.length) {
        await Promise.all(product.images.map((img) => this.s3Service.deleteFile(`${trashFolder}/image_${img}`)));
      }
    } catch (err) {
      console.warn("Failed to delete trash files, they can be cleaned later: ", err?.message);
    }

    return updatedProduct;
  }

  async remove(id: string, payload: any) {
    this.$isValidActor(payload);

    const product = await this.prisma.product.findUnique({ where: { id }, select: { video: true, images: true } });
    if (!product) {
      throw new BadRequestException("No Product found against the provided id to delete");
    }

    const trashFolder = `_trash/${id}/${Date.now()}`;
    const trashVideo = product.video ? `${trashFolder}/video_${product.video}` : null;
    const trashImages = product.images.map((image) => `${trashFolder}/image_${image}`);

    // Move video to trash if exists
    // Move images to trash first, these images url do not exists in s3 yet becayse this is seeding data and throwing exceptions when not found
    // uncoment the following block in real data and it will work.
    // try {
    //   if (product.video) await this.s3Service.moveFile(product.video, trashVideo!);
    // } catch (err) {
    //   throw new InternalServerErrorException(`Couldn't move video to trash: ${err?.message}`);
    // }

    // Move images to trash
    // Move images to trash first, these images url do not exists in s3 yet becayse this is seeding data and throwing exceptions when not found
    // uncoment the following block in real data and it will work.
    // try {
    //   await Promise.all(product.images.map((image, i) => this.s3Service.moveFile(image, trashImages[i])));
    // } catch (err) {
    //   if (product.video) await this.s3Service.moveFile(trashVideo!, product.video);
    //   throw new InternalServerErrorException(`Couldn't move images to trash: ${err?.message}`);
    // }

    // Delete product from DB
    try {
      const deletedProduct = await this.prisma.product.update({ where: { id }, data: { status: UserStatus.Deleted } });

      // permanently delete trash files after successful deletion
      // if (trashVideo) await this.s3Service.deleteFile(trashVideo);
      // await Promise.all(trashImages.map((image) => this.s3Service.deleteFile(image)));
      return deletedProduct;
    } catch (err) {
      // Rollback S3 moves in case of DB failure
      try {
        // Move images to trash first, these images url do not exists in s3 yet becayse this is seeding data and throwing exceptions when not found
        // uncoment the following block in real data and it will work.
        // if (product.video) await this.s3Service.moveFile(trashVideo!, product.video);
        // await Promise.all(product.images.map((image, i) => this.s3Service.moveFile(trashImages[i], image)));
      } catch (rollbackErr) {
        console.error(`Rollback Failed: ${rollbackErr?.message}`);
        // Optional: schedule a retry
      }
      throw new InternalServerErrorException(`Couldn't delete product: ${err?.message}`);
    }
  }

  // async remove(id: string, payload: any) {
  //   this.$isValidActor(payload);

  //   const product = await this.prisma.product.findUnique({ where: { id }, select: { video: true, images: true } });
  //   if (!product) {
  //     throw new BadRequestException("No Product found against the provided id to delete");
  //   }

  //   const trashFolder = `_trash/${Date.now()}`;
  //   const trashVideo = `${trashFolder}/video_${product.video}`;
  //   const trashImages = product.images.map((image) => `${trashFolder}/image_${image}`);

  //   try {
  //     if (product.video) await this.s3Service.moveFile(product.video, trashVideo);
  //   } catch (err) {
  //     throw new InternalServerErrorException(`Couldn't delete video from server: ${err?.message}`);
  //   }
  //   try {
  //     await Promise.all(product.images.map((image, i) => this.s3Service.moveFile(image, trashImages[i])));
  //   } catch (err) {
  //     if (product.video) await this.s3Service.moveFile(trashVideo, product.video);
  //     throw new InternalServerErrorException(`Couldn't delete images from server: ${err?.message}`);
  //   }

  //   try {
  //     const deletedProduct = await this.prisma.product.delete({ where: { id } });
  //     await this.s3Service.deleteFile(trashVideo);
  //     await Promise.all(trashImages.map((image) => this.s3Service.deleteFile(image)));
  //     return deletedProduct;
  //   } catch (err) {
  //     try {
  //       if (product.video) await this.s3Service.moveFile(trashVideo, product.video);
  //       await Promise.all(product.images.map((image, i) => this.s3Service.moveFile(trashImages[i], image)));
  //     } catch (err) {
  //       console.log(`Rollback Failed: ${err?.message}`);
  //       // Schedual a retry routine here.
  //     }
  //     throw new InternalServerErrorException(`Couldn't delete product: ${err?.message}`);
  //   }
  // }
}
