import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { UserService } from '../service/user.service';
import { Validate } from '@midwayjs/validate';

export class UserProfileDTO {
  id: number;
  name: string;
  profile: string;
}

@ApiTags('user')
@Controller('/user')
export class UpdateUserInfoController {
  @Inject()
  userService: UserService;

  @Post('/updateProfile')
  @Validate()
  async updateProfile(@Body() body: UserProfileDTO) {
    try {
      const { id, name, profile } = body;

      if (!name || !profile) {
        return {
          success: false,
          message: '用户名和简介不能为空',
          data: null,
        };
      }

      // 调用用户服务更新用户信息
      const updatedUser = await this.userService.updateProfile(id, {
        name,
        profile,
      });

      // 返回成功响应
      return {
        success: true,
        message: '用户信息更新成功',
        data: updatedUser,
      };
    } catch (error) {
      // 处理错误
      return {
        success: false,
        message: error.message || '更新失败',
        data: null,
      };
    }
  }
}
