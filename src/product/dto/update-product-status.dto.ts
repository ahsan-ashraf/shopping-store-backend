import { ApprovalState, OperationalState } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class UpdateProductStatusDto {
  @IsEnum(ApprovalState)
  @IsNotEmpty()
  @Transform(({ value }) => (value === "" ? undefined : value))
  approvalState: ApprovalState;

  @IsEnum(OperationalState)
  @IsNotEmpty()
  @Transform(({ value }) => (value === "" ? undefined : value))
  operationalState: OperationalState;
}
