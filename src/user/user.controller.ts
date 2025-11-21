import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/request/create-user.dto";
import { UpdateUserDto } from "./dto/request/update-user.dto";
import { CreateUserRiderDto } from "./dto/request/create-user-rider.dto";
import { CreateUserBuyerDto } from "./dto/request/create-user-buyer.dto";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("/register/admin")
  $createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Post("/register/buyer")
  $createBuyer(@Body() createUserBuyerDto: CreateUserBuyerDto) {
    return this.userService.createBuyer(createUserBuyerDto);
  }

  @Post("/register/rider")
  $createRider(@Body() createUserRiderDto: CreateUserRiderDto) {
    return this.userService.createRider(createUserRiderDto);
  }

  @Get()
  $findAll() {
    return this.userService.findAll();
  }

  @Get(":id")
  $findOne(@Param("id") id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(":id")
  $update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(":id")
  $remove(@Param("id") id: string) {
    return this.userService.remove(+id);
  }
}
