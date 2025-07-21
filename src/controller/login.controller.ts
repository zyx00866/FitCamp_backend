import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { UserService } from '../service/user.service';
import { JwtService } from '@midwayjs/jwt';
import { Validate } from '@midwayjs/validate';

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
      const { account, password } = body;

      if (!account || !password) {
        return {
          success: false,
          message: '用户名和密码不能为空',
          data: null,
        };
      }

      // 调用用户服务进行登录
      const user = await this.userService.login(account, password);

      // 返回成功响应（不包含密码）
      const { password: _, ...userInfo } = user;
      // 生成 JWT token
      const token = await this.jwtService.sign({ id: user.id });
      return {
        success: true,
        message: '登录成功',
        data: {
          user: userInfo,
          token,
        },
      };
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
