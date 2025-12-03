import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserAdminDto } from "./dto/request/create-user-admin.dto";
import { Response, Request } from "express";
import { CreateUserSellerDto } from "./dto/request/create-user-seller.dto";
import { CreateUserBuyerDto } from "./dto/request/create-user-buyer.dto";
import { CreateUserRiderDto } from "./dto/request/create-user-rider.dto";
import { LoginRequestDto } from "./dto/request/login-request-dto";
import { json } from "stream/consumers";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setResponseCookie(res: Response, accessToken: string, refreshToken: string) {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000, // 1 hour
      sameSite: "lax"
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax"
    });
  }

  @Post("/register/admin")
  @HttpCode(201)
  async registerAdmin(@Body() dto: CreateUserAdminDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.createAdmin(dto);
    this.setResponseCookie(res, accessToken, refreshToken);
    return user;
  }

  @Post("/register/seller")
  @HttpCode(201)
  async registerSeller(@Body() dto: CreateUserSellerDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.createSeller(dto);
    this.setResponseCookie(res, accessToken, refreshToken);
    return user;
  }

  @Post("/register/buyer")
  @HttpCode(201)
  async registerBuyer(@Body() dto: CreateUserBuyerDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.createBuyer(dto);
    this.setResponseCookie(res, accessToken, refreshToken);
    return user;
  }

  @Post("/register/rider")
  @HttpCode(201)
  async registerRider(@Body() dto: CreateUserRiderDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.createRider(dto);
    this.setResponseCookie(res, accessToken, refreshToken);
    return user;
  }

  @Post("/login")
  @HttpCode(200)
  async login(dto: LoginRequestDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.loginUser(dto);
    this.setResponseCookie(res, accessToken, refreshToken);
    return user;
  }

  @Post("/logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = req.cookies["accessToken"];
    const refreshToken = req.cookies["refreshToken"];

    if (!accessToken || !refreshToken) {
      return res.status(400).json({ message: "Tokens not found in cookies" });
    }

    await this.authService.logoutUser(accessToken, refreshToken);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return { message: "Logged out successfully" };
  }

  @Post("/refresh-tokens")
  @HttpCode(200)
  async refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldAccessToken = req.cookies["accessToken"];
    const oldRefreshToken = req.cookies["refreshToken"];

    if (!oldAccessToken || !oldRefreshToken) {
      return res.status(400).json({ message: "Tokens not found in cookies" });
    }

    const { accessToken, refreshToken, user } = await this.authService.refreshTokens(oldAccessToken, oldRefreshToken);

    this.setResponseCookie(res, accessToken, refreshToken);

    return user;
  }
}
