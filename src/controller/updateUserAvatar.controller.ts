import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { UserService } from '../service/user.service';
import { Validate } from '@midwayjs/validate';
import { Context as KoaContext } from '@midwayjs/koa';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

export class UpdateAvatarDTO {
  avatar: string;
}

@ApiTags('user')
@Controller('/user')
export class UpdateUserAvatarController {
  @Inject()
  userService: UserService;
  @Post('/updateAvatar')
  @Validate()
  async updateAvatar(ctx: KoaContext, @Body() body: UpdateAvatarDTO) {
    try {
      // 从JWT token中获取用户ID
      const userId = ctx.state.user.id;
      const { avatar } = body;
      if (!avatar) {
        return {
          success: false,
          message: '用户头像不能为空',
          data: null,
        };
      }
      // 获取用户当前信息（包含旧头像）
      const currentUser = await this.userService.getUserInfo(userId);
      const oldAvatar = currentUser.avatar;

      // 调用用户服务更新用户头像
      const updatedUser = await this.userService.updateAvatar(userId, avatar);

      // 删除旧头像文件（如果存在且不是默认头像）
      if (oldAvatar && oldAvatar !== avatar) {
        await this.deleteOldAvatarFile(oldAvatar);
      }

      // 返回成功响应（不包含密码）
      const { password: _, ...userInfo } = updatedUser;

      return {
        success: true,
        message: '用户头像更新成功',
        data: userInfo,
      };
    } catch (error) {
      console.error('更新头像错误:', error);
      return {
        success: false,
        message: error.message || '更新失败',
        data: null,
      };
    }
  }

  /**
   * 删除旧头像文件
   */
  private async deleteOldAvatarFile(oldAvatarPath: string): Promise<void> {
    try {
      console.log('🗑️ 尝试删除旧头像:', oldAvatarPath);

      let relativePath: string;

      if (
        oldAvatarPath.startsWith('http://') ||
        oldAvatarPath.startsWith('https://')
      ) {
        // 从完整URL中提取相对路径
        const url = new URL(oldAvatarPath);
        relativePath = url.pathname.replace('/static/', ''); // "/static/avatars/xxx.png" -> "avatars/xxx.png"
      } else if (oldAvatarPath.startsWith('/static/')) {
        // 处理相对路径格式: /static/avatars/xxx.png
        relativePath = oldAvatarPath.replace('/static/', ''); // "avatars/xxx.png"
      } else {
        console.log('⚠️ 无法识别的头像路径格式:', oldAvatarPath);
        return;
      }

      // 构建实际文件路径
      const filePath = join(process.cwd(), 'data', 'pictures', relativePath);
      console.log('📁 计算的文件路径:', filePath);

      // 检查文件是否存在
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        console.log('✅ 旧头像删除成功:', filePath);
      } else {
        console.log('⚠️ 旧头像文件不存在:', filePath);
      }
    } catch (error) {
      console.error('❌ 删除旧头像失败:', error);
      // 不抛出错误，避免影响头像更新
    }
  }
}
