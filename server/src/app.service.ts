import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  success() {
    return 'success';
  }
  error() {
    throw new HttpException('用户不存在', HttpStatus.NOT_FOUND); // 404
  }
}
