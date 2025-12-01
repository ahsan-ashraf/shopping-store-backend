import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { StoreService } from "./store.service";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { CreateStoreDto } from "./dto/create-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";

@Controller("store")
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get("/:storeId")
  async $getStore(@Param("storeId") storeId: string) {
    return await this.storeService.findOne(storeId);
  }
  @Post("/register")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "bannerImage", maxCount: 1 },
      { name: "iconImage", maxCount: 1 }
    ])
  )
  async $createStore(@Body() createStoreDto: CreateStoreDto, @UploadedFiles() files: { bannerImage: Express.Multer.File[]; iconImage: Express.Multer.File[] }) {
    try {
      const iconImage = files.iconImage[0];
      const bannerImage = files.bannerImage[0];

      if (!iconImage || !bannerImage) {
        throw new BadRequestException("Both banner and file images are required.");
      }

      const store = await this.storeService.create(createStoreDto, iconImage, bannerImage);
      return store;
    } catch (err) {
      throw err;
    }
  }
  @Patch("/update/:storeId")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Update store information",
    schema: {
      type: "object",
      properties: {
        storeName: { type: "string" },
        description: { type: "string" },
        categoryId: { type: "string" },
        youtube: { type: "string" },
        facebook: { type: "string" },
        instagram: { type: "string" },
        tiktok: { type: "string" },
        iconImage: { type: "string", format: "binary" },
        bannerImage: { type: "string", format: "binary" }
      }
    }
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "iconImage", maxCount: 1 },
      { name: "bannerImage", maxCount: 1 }
    ])
  )
  async $updateStore(@Param("storeId") storeId: string, @Body() updateStoreDto: UpdateStoreDto, @UploadedFiles() files: { iconImage: Express.Multer.File[]; bannerImage: Express.Multer.File[] }) {
    const updatedStore = await this.storeService.update(storeId, updateStoreDto, files?.iconImage?.[0], files?.bannerImage?.[0]);
    return updatedStore;
  }

  @Delete("/delete/:storeId")
  async $deleteStore(@Param("storeId") storeId: string) {
    return this.storeService.deleteStore(storeId);
  }
}
