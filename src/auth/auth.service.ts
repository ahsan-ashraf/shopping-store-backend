import { Body, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "prisma/prisma.service";
import { PrismaClientKnownRequestError } from "generated/prisma/internal/prismaNamespace";
import { CreateUserBuyerDto } from "./dto/request/create-user-buyer.dto";
import { CreateUserSellerDto } from "./dto/request/create-user-seller.dto";
import { CreateUserRiderDto } from "./dto/request/create-user-rider.dto";
import { LoginRequestDto } from "./dto/request/login-request-dto";
import { LoginResponseDto } from "./dto/response/login-response.dto";
import { JwtService } from "@nestjs/jwt";
import { CreateUserAdminDto } from "./dto/request/create-user-admin.dto";
import { Role, UserStatus } from "src/types";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  private $parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60_000;
      case "h":
        return value * 60 * 60_000;
      case "d":
        return value * 24 * 60 * 60_000;
      default:
        return 7 * 24 * 60 * 60_000; // default 7 days
    }
  }

  private $getPayload(user: any): object {
    return {
      sub: user.id,
      email: user.email,
      role: user.role
    };
  }
  private async $issueTokensForUser(userId: string, payload: object) {
    const tokens = this.$generateTokens(payload);
    await this.$saveRefreshToken(userId, tokens.refreshToken, "7d");
    return tokens;
  }
  private $generateTokens(payload: object) {
    const accessToken = this.jwt.sign(payload, { secret: process.env.JWT_SECRET, expiresIn: "1h" });
    const refreshToken = this.jwt.sign(payload, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: "7d" });
    return { accessToken, refreshToken };
  }
  private async $saveRefreshToken(userId: string, token: string, expiresIn: string) {
    const expiresAt = new Date(Date.now() + this.$parseExpiry(expiresIn));
    const savedRefreshToken = await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt }
    });
    return savedRefreshToken;
  }
  private async $revokeRefreshToken(tokenId: string) {
    await this.prisma.refreshToken.delete({ where: { id: tokenId } });
  }
  private async $revokeAllRefreshTokens(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
  private async $getHashedPassword(password: string) {
    try {
      return await bcrypt.hash(password, 10);
    } catch (err) {
      throw new InternalServerErrorException("Failed to hash password.");
    }
  }
  private $validatePassword(plainPassword: string, hashedPassword: string): Promise<Boolean> {
    const result = bcrypt.compare(plainPassword, hashedPassword);
    return result;
  }

  private async $registerUser(data: any, include: any) {
    try {
      const user = await this.prisma.user.create({ data, include });
      const { password, ...result } = user;

      return result;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(`User with this ${err.meta?.target?.[0]} already exists.`);
      }
      throw err;
    }
  }

  async createAdmin(dto: CreateUserAdminDto): Promise<LoginResponseDto> {
    const hashedPassword = await this.$getHashedPassword(dto.password);
    const userData = await this.$registerUser(
      {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        dob: dto.dob,
        gender: dto.gender,
        role: Role.Admin,
        status: UserStatus.PendingApproval,
        addresses: { create: dto.addresses }
      },
      { addresses: true }
    );

    const tokens = await this.$issueTokensForUser(userData.id, this.$getPayload(userData));
    return {
      ...tokens,
      user: userData
    };
  }
  async createBuyer(dto: CreateUserBuyerDto): Promise<LoginResponseDto> {
    const hashedPassword = await this.$getHashedPassword(dto.password);
    const userData = await this.$registerUser(
      {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        gender: dto.gender,
        dob: dto.dob,
        role: Role.Buyer,
        status: UserStatus.PendingApproval,
        buyer: {
          create: {
            walletAmount: dto.walletAmount
          }
        },
        addresses: {
          create: dto.addresses
        }
      },
      {
        addresses: true,
        buyer: true
      }
    );

    const tokens = await this.$issueTokensForUser(userData.id, this.$getPayload(userData));
    return {
      ...tokens,
      user: userData
    };
  }
  async createSeller(dto: CreateUserSellerDto): Promise<LoginResponseDto> {
    const hashedPassword = await this.$getHashedPassword(dto.password);
    const userData = await this.$registerUser(
      {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        gender: dto.gender,
        dob: dto.dob,
        role: Role.Seller,
        status: UserStatus.PendingApproval,
        seller: {
          create: {
            businessId: dto.businessId,
            IBAN: dto.IBAN
          }
        },
        addresses: {
          create: dto.addresses
        }
      },
      { addresses: true, seller: true }
    );

    const tokens = await this.$issueTokensForUser(userData.id, this.$getPayload(userData));
    return {
      ...tokens,
      user: userData
    };
  }
  async createRider(dto: CreateUserRiderDto): Promise<LoginResponseDto> {
    const hashedPassword = await this.$getHashedPassword(dto.password);
    const userData = await this.$registerUser(
      {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        gender: dto.gender,
        dob: dto.dob,
        role: Role.Rider,
        status: UserStatus.PendingApproval,
        rider: {
          create: {
            vehicleRegNo: dto.vehicleRegNo,
            companyPhone: dto.companyPhone
          }
        },
        addresses: {
          create: dto.addresses
        }
      },
      { addresses: true, rider: true }
    );

    const tokens = await this.$issueTokensForUser(userData.id, this.$getPayload(userData));
    return {
      ...tokens,
      user: userData
    };
  }

  async loginUser(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException("Invalid Credentials");
    }
    // const isPasswordValid = await this.$validatePassword(dto.password, user.password); // uncomment it later
    const isPasswordValid = dto.password === user.password;

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid Credentials");
    }

    const { password, ...userData } = user;
    const tokens = await this.$issueTokensForUser(userData.id, this.$getPayload(userData));

    return {
      ...tokens,
      user: userData
    };
  }
  async logoutUser(refreshToken: string) {
    const decodedRefreshToken = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    const tokenRecord = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (decodedRefreshToken.sub !== tokenRecord.userId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({ where: { id: tokenRecord.userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    await this.$revokeRefreshToken(tokenRecord.id);
  }
  async refreshTokens(oldRefreshToken: string): Promise<LoginResponseDto> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({ where: { token: oldRefreshToken } });
    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({ where: { id: tokenRecord.userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    await this.$revokeRefreshToken(tokenRecord.id);

    const { password, ...userData } = user;
    const tokens = await this.$issueTokensForUser(userData.id, this.$getPayload(userData));

    return { ...tokens, user: userData };
  }
}
