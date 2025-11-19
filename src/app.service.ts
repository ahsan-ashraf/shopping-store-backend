import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  getIntro(): string {
    return 'Welcome to the shopping store api docs';
  }
}
