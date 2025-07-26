import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { ActivityService } from '../service/activity.service';
import { Validate } from '@midwayjs/validate';

@ApiTags(['activity'])
@Controller('/activity')
export class SignUpActivityController {
  @Inject()
  activityService: ActivityService;

  @Post('/signup')
  @Validate()
  async signUpActivity(@Body() body: { userId: number; activityId: string }) {
    const { userId, activityId } = body;
    try {
      return await this.activityService.joinActivity(userId, activityId);
    } catch (error) {
      return {
        success: false,
        message: error.message || '报名活动失败',
        data: null,
      };
    }
  }
  @Post('/leave')
  @Validate()
  async leaveActivity(@Body() body: { userId: number; activityId: string }) {
    const { userId, activityId } = body;
    try {
      return await this.activityService.leaveActivity(userId, activityId);
    } catch (error) {
      return {
        success: false,
        message: error.message || '取消报名活动失败',
        data: null,
      };
    }
  }
}
