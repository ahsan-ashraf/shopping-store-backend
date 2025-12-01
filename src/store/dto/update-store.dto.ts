import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, Length } from "class-validator";

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(5, 30)
  @Transform(({ value }) => (value === "" ? undefined : value))
  storeName: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(10, 200)
  @Transform(({ value }) => (value === "" ? undefined : value))
  description: string;

  @IsOptional()
  // @IsUUID()  // TODO: revert it later
  @IsString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  categoryId: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => (value === "" ? undefined : value))
  youtube: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => (value === "" ? undefined : value))
  facebook: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => (value === "" ? undefined : value))
  instagram: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => (value === "" ? undefined : value))
  tiktok: string;
}
