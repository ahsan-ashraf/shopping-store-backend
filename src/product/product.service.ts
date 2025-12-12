import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { PrismaService } from "prisma/prisma.service";
import { S3Service } from "src/s3/s3.service";
import { ApprovalState, OperationalState, Prisma } from "@prisma/client";
import { Utils } from "src/utils/utils";
import { UpdateProductStatusDto } from "./dto/update-product-status.dto";
import { PrismaClientKnownRequestError } from "generated/prisma/internal/prismaNamespace";

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
    await this.$isValidActor(payload);

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new BadRequestException("Store Not Found");
    } else if (store.approvalState !== ApprovalState.Approved) {
      throw new BadRequestException("Couldn't add product. Store is not yet approved by the administration.");
    } else if (store.operationalState !== OperationalState.Active) {
      throw new BadRequestException(`Couldn't add product. This Store is not ${store.operationalState}.`);
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

  async addToWishList(productId: string, payload: any) {
    await this.$isValidActor(payload);

    // const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    // const product = await this.prisma.product.findUnique({ where: { id: productId } });
    // if (!product) {
    //   throw new NotFoundException("Product not found");
    // } else if (product.approvalState !== ApprovalState.Approved || product.operationalState !== OperationalState.Active) {
    //   throw new BadRequestException("Couldn't add inactive product to wishlist.");
    // }

    // if (!user) {
    //   throw new NotFoundException("User not found");
    // }

    // const exists = await this.prisma.wishlist.findUnique({ where: { buyerId_productId: { productId, buyerId: payload.sub } } });
    // if (exists) {
    //   throw new BadRequestException("Product is already in wishlist.");
    // }

    // const wishlistedProduct = await this.prisma.wishlist.create({
    //   data: {
    //     productId,
    //     buyerId: payload.sub
    //   }
    // });
    // return wishlistedProduct;

    // as my wishlist table has unique composite key of productId and buyerId so if any product is enterend twice
    // in wishlist it will throw a unique constraint voilation exception, indicating product already exists in table
    // so no need to manually perform validation checks as done above, extremely fast, efficient, reliable in concurrency.
    try {
      const wishlistedProduct = await this.prisma.wishlist.create({ data: { productId, buyerId: payload.sub } });
      return wishlistedProduct;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("Product already in wishlist.");
      }
      throw err;
    }
  }
  async removeFromWishlist(productId: string, payload: any) {
    await this.$isValidActor(payload);

    try {
      const removedProductFromWishlist = await this.prisma.wishlist.delete({ where: { buyerId_productId: { buyerId: payload.sub, productId } } });
      return removedProductFromWishlist;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
        throw new NotFoundException("Product not found in wishlist");
      }
      throw err;
    }
  }

  async addToCart(productId: string, payload: any) {
    await this.$isValidActor(payload);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException("Product not found to add to cart");
    }

    try {
      const productAddedToCart = await this.prisma.cart.create({
        data: {
          productId,
          buyerId: payload.sub,
          qty: 1,
          priceAtAddition: product.price,
          salePriceAtAddition: product.salePrice
        }
      });
      return productAddedToCart;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("Product already exists in cart");
      }
      throw err;
    }
  }
  async updateCartQty(productId: string, change: number, payload: any) {
    await this.$isValidActor(payload);
    if (change === 0) {
      throw new BadRequestException("Change value cannot be zero");
    }
    try {
      const updatedCart = await this.prisma.cart.update({
        where: { buyerId_productId: { buyerId: payload.sub, productId } },
        data: { qty: { increment: change } }
      });

      if (updatedCart.qty < 1) {
        await this.prisma.cart.delete({ where: { buyerId_productId: { buyerId: payload.sub, productId } } });
        return { message: "Product removed from cart as qty reached to 0" };
      } else {
        return updatedCart;
      }
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
        throw new NotFoundException("Product not found in cart to udpate qty");
      }
      throw err;
    }
  }
  async removeFromCart(productId: string, payload: any) {
    await this.$isValidActor(payload);

    try {
      const deletedProduct = await this.prisma.cart.delete({ where: { buyerId_productId: { buyerId: payload.sub, productId } } });
      return deletedProduct;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
        throw new NotFoundException("Product not found in cart to delete");
      }
      throw err;
    }
  }

  async findAll(storeId: string, payload: any) {
    await this.$isValidActor(payload);

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
    await this.$isValidActor(payload);
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
    await this.$isValidActor(payload);

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

  async updateStatus(id: string, dto: UpdateProductStatusDto, payload: any, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    await this.$isValidActor(payload);

    try {
      const updatedProduct = await db.product.update({ where: { id }, data: { ...dto }, select: { id: true, title: true, approvalState: true, operationalState: true } });
      return updatedProduct;
    } catch (err) {
      if (err.code === "P2025") {
        throw new NotFoundException("Product not found to update status");
      }
      throw err;
      // TODO: use above try catch method everywhere where i'm updating/delete records
    }
  }

  async remove(id: string, payload: any, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    await this.$isValidActor(payload);

    const product = await db.product.findUnique({ where: { id }, select: { video: true, images: true } });
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
      const deleteStatusDto = { operationalState: OperationalState.Blocked };
      const deletedProduct = await db.product.update({ where: { id }, data: { ...deleteStatusDto } });

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
  //   await this.$isValidActor(payload);

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
