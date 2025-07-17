import { Get, Controller, Inject, Query } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { UserService } from '../service/user.service';
import { Validate } from '@midwayjs/validate';

@ApiTags('user')
@Controller('/user')
export class GetUserInfoController {
  @Inject()
  userService: UserService;

  @Get('/userInfo')
  @Validate()
  async getUserInfo(@Query('id') id: number) {
    try {
      // 调用用户服务获取用户信息
      const user = await this.userService.getUserInfo(id);

      // 返回成功响应（不包含密码）
      const { password: _, ...userInfo } = user;

      return {
        success: true,
        message: '获取用户信息成功',
        data: userInfo,
      };
    } catch (error) {
      // 处理错误，如用户不存在
      return {
        success: false,
        message: error.message || '获取用户信息失败',
        data: null,
      };
    }
  }
}
