import { Provide } from '@midwayjs/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Activity, ActivityType } from '../entity/activity.entity';

@Provide()
export class ActivityService {
  @InjectEntityModel(Activity)
  activityRepo: Repository<Activity>;

  // 创建活动
  async createActivity(activityData: Partial<Activity>) {
    const activity = this.activityRepo.create(activityData);
    return await this.activityRepo.save(activity);
  }

  // 获取活动列表
  async getActivities(type?: string) {
    // 如果没有指定类型或类型为'全部'，返回所有活动
    if (!type || type === '全部') {
      return await this.activityRepo.find({
        relations: ['participants', 'comments', 'favoritedBy'],
      });
    }

    // 根据指定类型筛选活动
    return await this.activityRepo.find({
      where: { type: type as ActivityType },
      relations: ['participants', 'comments', 'favoritedBy'],
    });
  }

  // 获取单个活动详情
  async getActivityById(id: string) {
    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: ['participants', 'comments', 'favoritedBy'],
    });
    if (!activity) {
      throw new Error('活动不存在');
    }
    return activity;
  }

  // 更新活动信息
  async updateActivity(id: string, updateData: Partial<Activity>) {
    let activity = await this.activityRepo.findOneBy({ id });
    if (!activity) {
      throw new Error('活动不存在');
    }
    activity = Object.assign(activity, updateData);
    return await this.activityRepo.save(activity);
  }

  // 删除活动
  async deleteActivity(id: string) {
    const result = await this.activityRepo.delete(id);
    if (result.affected === 0) {
      throw new Error('活动不存在或已被删除');
    }
    return { success: true };
  }
}
