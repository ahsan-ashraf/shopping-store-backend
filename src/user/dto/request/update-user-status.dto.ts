import { ApprovalState, OperationalState } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateUserStatusDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value === "" ? undefined : value))
  approvalState: ApprovalState;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value === "" ? undefined : value))
  operationalState: OperationalState;
}
