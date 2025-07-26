import { Get, Controller, Inject, Query } from '@midwayjs/core';
import { ApiTags, ApiOperation, ApiQuery } from '@midwayjs/swagger';
import { ActivityService } from '../service/activity.service';
import { ActivityType } from '../entity/activity.entity';
import { Validate } from '@midwayjs/validate';

@ApiTags('activity')
@Controller('/activity')
export class GetActivitiesController {
  @Inject()
  activityService: ActivityService;

  @Get('/list')
  @ApiOperation({ summary: '获取活动列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认20' })
  @ApiQuery({ name: 'type', required: false, description: '活动类型' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  async getActivities(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('type') type?: ActivityType,
    @Query('keyword') keyword?: string
  ) {
    try {
      console.log('📋 获取活动列表请求参数:', {
        page: page,
        limit: limit,
        type: type,
      });

      // 转换参数类型
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;

      const result = await this.activityService.getActivities(
        pageNum,
        limitNum,
        type,
        keyword
      );

      return {
        success: true,
        message: '获取活动列表成功',
        data: result,
      };
    } catch (error) {
      console.error('获取活动列表错误:', error);
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
