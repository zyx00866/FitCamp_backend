import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { UserService } from '../service/user.service';
import { JwtService } from '@midwayjs/jwt';
import { Validate } from '@midwayjs/validate';
import { join } from 'path';

export class LoginDTO {
  account: string;
  password: string;
}

@ApiTags('user')
@Controller('/user')
export class LoginController {
  @Inject()
  userService: UserService;

  @Inject()
  jwtService: JwtService;

  @Post('/login')
  @Validate()
  async login(@Body() body: LoginDTO) {
    try {
      console.log('数据库路径:', join(__dirname, '../data/fitcamp.sqlite'));
      const { account, password } = body;

      if (!account || !password) {
        return {
          success: false,
          message: '用户名和密码不能为空',
          data: null,
        };
      }

      return await this.userService.login(account, password);
    } catch (error) {
      // 处理错误，如用户不存在或密码错误
      return {
        success: false,
        message: error.message || '登录失败',
        data: null,
      };
    }
  }
}
