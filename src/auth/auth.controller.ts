import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Response, Request } from "express";
import { CreateUserSellerDto } from "./dto/request/create-user-seller.dto";
import { CreateUserBuyerDto } from "./dto/request/create-user-buyer.dto";
import { CreateUserRiderDto } from "./dto/request/create-user-rider.dto";
import { LoginRequestDto } from "./dto/request/login-request-dto";
import { CreateUserAdminDto } from "./dto/request/create-user-admin.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { RolesGuard } from "./guards/roles.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setResponseCookie(res: Response, accessToken: string, refreshToken: string, user: any) {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000, // 1 hour
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });

    res.cookie("authData", user, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
  }

  @Post("/register/admin")
  @HttpCode(201)
  async registerAdmin(@Body() dto: CreateUserAdminDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, userId } = await this.authService.createAdmin(dto);
    const user = await this.authService.getMe(userId);
    this.setResponseCookie(res, accessToken, refreshToken, user);
    return user;
  }

  @Post("/register/seller")
  @HttpCode(201)
  async registerSeller(@Body() dto: CreateUserSellerDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, userId } = await this.authService.createSeller(dto);
    const user = await this.authService.getMe(userId);
    this.setResponseCookie(res, accessToken, refreshToken, user);
    return user;
  }

  @Post("/register/buyer")
  @HttpCode(201)
  async registerBuyer(@Body() dto: CreateUserBuyerDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, userId } = await this.authService.createBuyer(dto);
    const user = await this.authService.getMe(userId);
    this.setResponseCookie(res, accessToken, refreshToken, user);
    return user;
  }

  @Post("/register/rider")
  @HttpCode(201)
  async registerRider(@Body() dto: CreateUserRiderDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, userId } = await this.authService.createRider(dto);
    const user = await this.authService.getMe(userId);
    this.setResponseCookie(res, accessToken, refreshToken, user);
    return user;
  }

  @Post("/login")
  @HttpCode(200)
  async login(@Body() dto: LoginRequestDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, userId } = await this.authService.loginUser(dto);
    const user = await this.authService.getMe(userId);
    this.setResponseCookie(res, accessToken, refreshToken, user);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get("/me")
  @HttpCode(200)
  async getMe(@Req() req: any) {
    const userId = req.user.id;
    const user = await this.authService.getMe(userId);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post("/logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies["refreshToken"];
    if (!refreshToken) return new BadRequestException("Refresh Token not found");
    await this.authService.logoutUser(refreshToken);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return { message: "Logged out successfully" };
  }

  @UseGuards(JwtRefreshGuard)
  @Post("/refresh-tokens")
  @HttpCode(200)
  async refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldAccessToken = req.cookies["accessToken"];
    const oldRefreshToken = req.cookies["refreshToken"];

    if (!oldAccessToken || !oldRefreshToken) {
      return res.status(400).json({ message: "Tokens not found in cookies" });
    }

    const { accessToken, refreshToken, userId } = await this.authService.refreshTokens(oldRefreshToken);
    const user = await this.authService.getMe(userId);
    this.setResponseCookie(res, accessToken, refreshToken, user);

    return user;
  }
}
