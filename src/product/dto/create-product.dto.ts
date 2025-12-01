import { IsString, IsNotEmpty, IsNumber, IsArray, ArrayNotEmpty, ArrayUnique, IsOptional, IsBoolean, IsPositive, Min, IsDate, IsUUID, Length } from "class-validator";
import { Transform, Type } from "class-transformer";

export class CreateProductDto {
  @Min(0)
  @Type(() => Number)
  @IsNumber()
  stock: number;

  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(100, 2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 30)
  brand: string;

  @IsArray()
  @Type(() => String)
  @IsOptional()
  @ArrayUnique()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value); // support JSON format
    } catch {
      return [value]; // convert single values to array
    }
  })
  color?: string[];

  @IsArray()
  @Type(() => String)
  @IsOptional()
  @ArrayUnique()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value); // support JSON format
    } catch {
      return [value]; // convert single values to array
    }
  })
  size?: string[];

  @IsArray()
  @Type(() => String)
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value); // support JSON format
    } catch {
      return [value]; // convert single values to array
    }
  })
  tags: string[];

  @IsBoolean()
  @Transform(({ value }) => {
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    return value;
  })
  returnPolicy: boolean;

  @IsBoolean()
  @Transform(({ value }) => {
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    return value;
  })
  warranty: boolean;

  @Min(0)
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsPositive()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()
  @Min(0)
  @Type(() => Number)
  @IsNumber()
  salePrice?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => {
    if (!value || value === "" || value === null) return undefined;
    return value;
  })
  saleExpiresAt?: Date;
}
