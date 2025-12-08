import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { StoreService } from "./store.service";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { CreateStoreDto } from "./dto/request/create-store.dto";
import { UpdateStoreDto } from "./dto/request/update-store.dto";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UpdateStoreStatusDto } from "./dto/request/update-store-status.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("Seller", "Admin", "SuperAdmin")
@Controller("store")
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get("/")
  async getAllStores(@Req() req: any) {
    return await this.storeService.getAllStores(req.user);
  }

  @Get("/:storeId")
  async getStore(@Param("storeId") storeId: string, @Req() req: any) {
    return await this.storeService.findOne(storeId, req.user);
  }

  @Post("/register")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "bannerImage", maxCount: 1 },
      { name: "iconImage", maxCount: 1 }
    ])
  )
  async createStore(@Body() createStoreDto: CreateStoreDto, @Req() req: any, @UploadedFiles() files: { bannerImage: Express.Multer.File[]; iconImage: Express.Multer.File[] }) {
    try {
      const iconImage = files.iconImage[0];
      const bannerImage = files.bannerImage[0];

      if (!iconImage || !bannerImage) {
        throw new BadRequestException("Both banner and file images are required.");
      }

      const store = await this.storeService.create(createStoreDto, req.user, iconImage, bannerImage);
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
  async updateStore(
    @Param("storeId") storeId: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @Req() req: any,
    @UploadedFiles() files: { iconImage: Express.Multer.File[]; bannerImage: Express.Multer.File[] }
  ) {
    const updatedStore = await this.storeService.update(storeId, updateStoreDto, req.user, files?.iconImage?.[0], files?.bannerImage?.[0]);
    return updatedStore;
  }

  @Roles("SuperAdmin", "Admin")
  @Patch("/update-status/:storeId")
  async updateStatus(@Param("storeId") storeId: string, @Body() dto: UpdateStoreStatusDto, @Req() req: any) {
    const updatedStore = await this.storeService.updateStatus(storeId, dto, req.user);
    return updatedStore;
  }

  @Delete("/delete/:storeId")
  async deleteStore(@Param("storeId") storeId: string, @Req() req: any) {
    return this.storeService.deleteStore(storeId, req.user);
  }
}
