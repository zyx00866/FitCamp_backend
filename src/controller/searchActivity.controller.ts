import { Get, Controller, Inject, Query } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { ActivityService } from '../service/activity.service';
import { Validate } from '@midwayjs/validate';

@ApiTags(['activity'])
@Controller('/activity')
export class SearchActivityController {
  @Inject()
  activityService: ActivityService;

  @Get('/search')
  @Validate()
  async searchActivities(@Query('value') value: string) {
    try {
      const activities = await this.activityService.searchActivities(value);
      return {
        success: true,
        message: '搜索活动成功',
        data: activities,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '搜索活动失败',
        data: null,
      };
    }
  }
}
