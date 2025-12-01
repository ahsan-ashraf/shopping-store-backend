import { IsNotEmpty, IsString, IsUrl, IsUUID, Length } from "class-validator";

export class CreateStoreDto {
  @IsUUID()
  sellerId: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 30)
  storeName: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 200)
  description: string;

  // @IsUUID()  // TODO: revert it later
  @IsString()
  categoryId: string;

  @IsUrl()
  youtube: string;

  @IsUrl()
  facebook: string;

  @IsUrl()
  instagram: string;

  @IsUrl()
  tiktok: string;
}
