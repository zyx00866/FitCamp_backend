import { Get, Controller, Inject, Query } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { ActivityService } from '../service/activity.service';
import { Validate } from '@midwayjs/validate';
import { ActivityType } from '../entity/activity.entity';

@ApiTags('activity')
@Controller('/activity')
export class GetActivitiesController {
  @Inject()
  activityService: ActivityService;

  @Get('/list')
  @Validate()
  async getActivities(@Query('type') type: ActivityType) {
    try {
      const activities = await this.activityService.getActivities(type);
      return {
        success: true,
        message: '获取活动列表成功',
        data: activities,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取活动列表失败',
        data: null,
      };
    }
  }

  @Get('/detail')
  @Validate()
  async getActivityById(@Query('id') id: string) {
    try {
      const activity = await this.activityService.getActivityById(id);
      return {
        success: true,
        message: '获取活动详情成功',
        data: activity,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取活动详情失败',
        data: null,
      };
    }
  }
}
