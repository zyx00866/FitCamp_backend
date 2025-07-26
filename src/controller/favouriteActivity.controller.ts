import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { ActivityService } from '../service/activity.service';
import { Validate } from '@midwayjs/validate';

@ApiTags(['activity'])
@Controller('/activity')
export class FavouriteActivityController {
  @Inject()
  activityService: ActivityService;

  @Post('/favourite')
  @Validate()
  async favouriteActivity(
    @Body() body: { userId: number; activityId: string }
  ) {
    const { userId, activityId } = body;
    try {
      return await this.activityService.favouriteActivity(userId, activityId);
    } catch (error) {
      return {
        success: false,
        message: error.message || '收藏活动失败',
        data: null,
      };
    }
  }

  @Post('/unfavourite')
  @Validate()
  async unfavouriteActivity(
    @Body() body: { userId: number; activityId: string }
  ) {
    const { userId, activityId } = body;
    try {
      return await this.activityService.unfavouriteActivity(userId, activityId);
    } catch (error) {
      return {
        success: false,
        message: error.message || '取消收藏活动失败',
        data: null,
      };
    }
  }
}
