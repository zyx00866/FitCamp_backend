// src/controller/online.controller.ts
import { Get, Post, Controller, Inject } from '@midwayjs/core';
import { ApiTags, ApiOperation } from '@midwayjs/swagger';
import { UserService } from '../service/user.service';
import { Context } from '@midwayjs/koa';

@ApiTags('online')
@Controller('/user')
export class OnlineController {
  @Inject()
  userService: UserService;

  @Inject()
  ctx: Context;

  @Get('/online')
  @ApiOperation({ summary: '获取在线用户列表' })
  async getOnlineUsers() {
    try {
      const result = await this.userService.getOnlineUsers();
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取在线用户失败',
        data: null,
      };
    }
  }

  @Post('/logout')
  @ApiOperation({ summary: '用户登出' })
  async logout() {
    try {
      const token = this.extractToken();
      const result = await this.userService.logout(token);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || '登出失败',
        data: null,
      };
    }
  }

  private extractToken(): string {
    const authHeader = this.ctx.headers.authorization;
    return authHeader?.replace('Bearer ', '') || '';
  }
}
