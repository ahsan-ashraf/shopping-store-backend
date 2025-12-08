import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors, UseGuards, Req } from "@nestjs/common";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("product")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Roles("Seller")
  @Post("/:storeId")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Create a new product with images and video",
    schema: {
      type: "object",
      properties: {
        stock: { type: "number" },
        title: { type: "string" },
        description: { type: "string" },
        brand: { type: "string" },
        color: { type: "array", items: { type: "string" } },
        size: { type: "array", items: { type: "string" } },
        tags: { type: "array", items: { type: "string" } },
        returnPolicy: { type: "boolean" },
        warranty: { type: "boolean" },
        price: { type: "number" },
        salePrice: { type: "number" },
        saleExpiresAt: { type: "string", format: "date-time" },
        images: { type: "string", format: "binary" },
        video: { type: "string", format: "binary" }
      }
    }
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "images", maxCount: 10 },
      { name: "video", maxCount: 1 }
    ])
  )
  async create(@Param("storeId") storeId: string, @Body() dto: CreateProductDto, @Req() req: any, @UploadedFiles() files: { images: Express.Multer.File[]; video: Express.Multer.File[] }) {
    return await this.productService.create(storeId, dto, req.user, files.images, files.video?.[0] || null);
  }

  @Roles("Buyer", "Seller", "Admin", "SuperAdmin")
  @Get("/:storeId")
  async findAll(@Param("storeId") storeId: string, @Req() req: any) {
    // TODO: validate user and seller from jwt first
    return await this.productService.findAll(storeId, req.user);
  }

  @Roles("Buyer", "Seller", "Admin", "SuperAdmin")
  @Get(":productId")
  async findOne(@Param("productId") productId: string, @Req() req: any) {
    // TODO: validate user and seller from jwt first
    return await this.productService.findOne(productId, req.user);
  }

  @Roles("Seller")
  @Patch(":productId")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Update product with images and video",
    schema: {
      type: "object",
      properties: {
        stock: { type: "number" },
        title: { type: "string" },
        description: { type: "string" },
        brand: { type: "string" },
        color: { type: "array", items: { type: "string" } },
        size: { type: "array", items: { type: "string" } },
        tags: { type: "array", items: { type: "string" } },
        returnPolicy: { type: "boolean" },
        warranty: { type: "boolean" },
        price: { type: "number" },
        salePrice: { type: "number" },
        saleExpiresAt: { type: "string", format: "date-time" },
        images: { type: "string", format: "binary" },
        video: { type: "string", format: "binary" }
      },
      required: ["stock", "title", "description", "brand", "tags", "returnPolicy", "warranty", "price"]
    }
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "images", maxCount: 10 },
      { name: "video", maxCount: 1 }
    ])
  )
  async update(@Param("productId") productId: string, @Body() dto: UpdateProductDto, @Req() req: any, @UploadedFiles() files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] }) {
    //TODO:  validate users and otehr things before sending request here
    return await this.productService.update(productId, dto, req.user, files.images || null, files.video?.[0] || null);
  }

  @Roles("Seller", "Admin", "SuperAdmin")
  @Delete(":productId")
  async remove(@Param("productId") productId: string, @Req() req: any) {
    // TODO: validate user and seller from jwt ids first, also get store id to add that in trash folder directory
    return await this.productService.remove(productId, req.user);
  }
}
