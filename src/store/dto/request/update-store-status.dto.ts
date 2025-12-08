import { UserStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateStoreStatusDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value === "" ? undefined : value))
  status: UserStatus;
}
