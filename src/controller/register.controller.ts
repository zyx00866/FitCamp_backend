import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { UserService } from '../service/user.service';
import { Validate } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';

export class RegisterDTO {
  account: string;
  password: string;
  name: string;
}

export class UnregisterDTO {
  userId?: number;
  password: string; // ✅ 需要密码确认
}

@ApiTags('user')
@Controller('/user')
export class RegisterController {
  @Inject()
  userService: UserService;

  @Inject()
  ctx: Context;

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

      const user = await this.userService.register(account, password, name);
      const { password: _, ...userInfo } = user;

      return {
        success: true,
        message: '注册成功',
        data: userInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '注册失败',
        data: null,
      };
    }
  }

  @Post('/unregister')
  @Validate()
  async unregister(@Body() body: UnregisterDTO) {
    try {
      const { userId, password } = body;

      // ✅ 获取当前登录用户ID
      const currentUserId = this.ctx.state.user.id;
      const targetUserId = userId || currentUserId;

      if (!password) {
        return {
          success: false,
          message: '请输入密码确认',
          data: null,
        };
      }

      // ✅ 验证密码
      const isValidPassword = await this.userService.validatePassword(
        targetUserId,
        password
      );
      if (!isValidPassword) {
        return {
          success: false,
          message: '密码错误',
          data: null,
        };
      }

      // ✅ 只允许删除自己的账户
      if (currentUserId !== targetUserId) {
        return {
          success: false,
          message: '只能注销自己的账户',
          data: null,
        };
      }

      console.log(`🔐 用户 ${currentUserId} 请求注销账户`);

      await this.userService.unregister(targetUserId);

      return {
        success: true,
        message: '账户注销成功',
        data: null,
      };
    } catch (error) {
      console.error('❌ 注销失败:', error);
      return {
        success: false,
        message: error.message || '注销失败',
        data: null,
      };
    }
  }
}
