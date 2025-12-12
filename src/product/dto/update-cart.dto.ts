import { IsIn } from "class-validator";

export class UpdateCartDto {
  @IsIn([1, -1], { message: "Change must be either +1 or -1." })
  change: number;
}
