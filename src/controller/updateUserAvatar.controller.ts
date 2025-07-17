import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { UserService } from '../service/user.service';
import { Validate } from '@midwayjs/validate';

export class UpdateAvatarDTO {
  id: number;
  avatar: string;
}
@ApiTags('user')
@Controller('/user')
export class UpdateUserAvatarController {
  @Inject()
  userService: UserService;

  @Post('/updateAvatar')
  @Validate()
  async updateAvatar(@Body() body: UpdateAvatarDTO) {
    try {
      const { id, avatar } = body;

      if (!avatar) {
        return {
          success: false,
          message: '用户头像不能为空',
          data: null,
        };
      }

      // 调用用户服务更新用户头像
      const updatedUser = await this.userService.updateAvatar(id, avatar);

      // 返回成功响应
      return {
        success: true,
        message: '用户头像更新成功',
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
