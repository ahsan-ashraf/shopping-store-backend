import { IsString, IsNotEmpty, IsNumber, IsArray, ArrayNotEmpty, ArrayUnique, IsOptional, IsBoolean, IsPositive, Min, IsDate, IsUUID, Length } from "class-validator";
import { Transform, Type } from "class-transformer";

export class UpdateProductDto {
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  @IsOptional()
  stock?: number;

  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  @Length(100, 2000)
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 30)
  @IsOptional()
  brand?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? JSON.parse(value) : value))
  @IsOptional()
  color?: string[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? JSON.parse(value) : value))
  @IsOptional()
  size?: string[];

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Transform(({ value }) => (value ? (typeof value === "string" ? JSON.parse(value) : value) : []))
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @Transform(({ value }) => value === "true")
  @IsOptional()
  returnPolicy?: boolean;

  @IsBoolean()
  @Transform(({ value }) => value === "true")
  @IsOptional()
  warranty?: boolean;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  @IsOptional()
  rating?: number;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  @IsOptional()
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  salePrice?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  saleExpiresAt?: Date;
}
