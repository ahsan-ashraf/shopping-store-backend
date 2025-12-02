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
      }
    }
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "images", maxCount: 10 },
      { name: "video", maxCount: 1 }
    ])
  )
  create(@Param("storeId") storeId: string, @Body() createProductDto: CreateProductDto, @UploadedFiles() files: { images: Express.Multer.File[]; video: Express.Multer.File[] }) {
    // TODO: make sure its a valid seller, user and store from jwt.
    // i'll put all store's ids inside jwt so get store ids from there, for now i'm passing it in arguments
    return this.productService.create(storeId, createProductDto, files.images, files.video?.[0] || null);
  }

  @Get("/:storeId")
  findAll(@Param("storeId") storeId: string) {
    // TODO: validate user and seller from jwt first
    return this.productService.findAll(storeId);
  }

  @Get(":productId")
  findOne(@Param("productId") productId: string) {
    // TODO: validate user and seller from jwt first
    return this.productService.findOne(productId);
  }

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
  update(@Param("productId") productId: string, @Body() updateProductDto: UpdateProductDto, @UploadedFiles() files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] }) {
    //TODO:  validate users and otehr things before sending request here
    return this.productService.update(productId, updateProductDto, files.images || null, files.video?.[0] || null);
  }

  @Delete(":productId")
  remove(@Param("productId") productId: string) {
    // TODO: validate user and seller from jwt ids first, also get store id to add that in trash folder directory
    return this.productService.remove(productId);
  }
}
