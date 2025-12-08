import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          if (!req || !req.cookies) {
            return null;
          }
          return req.cookies.accessToken;
        }
      ]),
      ingoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET
    });
  }

  validate(payload: any) {
    if (!payload) {
      return new UnauthorizedException();
    }

    return payload;
  }
}
