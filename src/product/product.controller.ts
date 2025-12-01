import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { FileFieldsInterceptor } from "@nestjs/platform-express";

@Controller("product")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

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
      },
      required: ["stock", "title", "description", "brand", "tags", "returnPolicy", "warranty", "price", "images"]
    }
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "images", maxCount: 10 },
      { name: "video", maxCount: 1 }
    ])
  )
  create(@Param("storeId") storeId: string, @Body() createProductDto: CreateProductDto, @UploadedFiles() files: { images: Express.Multer.File[]; video: Express.Multer.File[] }) {
    return this.productService.create(storeId, createProductDto, files.images, files.video?.[0] || null);
  }

  @Get("/:storeId")
  findAll(@Param("storeId") storeId: string) {
    return this.productService.findAll(storeId);
  }

  @Get(":productId")
  findOne(@Param("productId") productId: string) {
    return this.productService.findOne(productId);
  }

  @Patch(":productId")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Update a product with optional images/video",
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
        rating: { type: "number" },
        price: { type: "number" },
        salePrice: { type: "number" },
        saleExpiresAt: { type: "string", format: "date-time" },
        images: { type: "string", format: "binary" },
        video: { type: "string", format: "binary" }
      },
      required: []
    }
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "images", maxCount: 10 },
      { name: "video", maxCount: 1 }
    ])
  )
  update(@Param("productId") productId: string, @Body() updateProductDto: UpdateProductDto, @UploadedFiles() files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] }) {
    return this.productService.update(productId, updateProductDto, files.images || null, files.video?.[0] || null);
  }

  @Delete(":productId")
  remove(@Param("productId") productId: string) {
    return this.productService.remove(productId);
  }
}
