import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { UserService } from '../service/user.service';
import { Validate } from '@midwayjs/validate';

export class RegisterDTO {
  account: string;
  password: string;
  name: string;
}

@ApiTags('user')
@Controller('/user')
export class RegisterController {
  @Inject()
  userService: UserService;

  @Post('/register')
  @Validate()
  async register(@Body() body: RegisterDTO) {
    try {
      const { account, password, name } = body;

      if (!account || !password || !name) {
        return {
          success: false,
          message: '账号，用户名，密码不能为空',
          data: null,
        };
      }

      // 调用用户服务进行注册
      const user = await this.userService.register(account, password, name);

      // 返回成功响应（不包含密码）
      const { password: _, ...userInfo } = user;

      return {
        success: true,
        message: '注册成功',
        data: userInfo,
      };
    } catch (error) {
      // 处理已存在用户等错误
      return {
        success: false,
        message: error.message || '注册失败',
        data: null,
      };
    }
  }
}
