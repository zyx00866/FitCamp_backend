import { Provide } from '@midwayjs/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Activity, ActivityType } from '../entity/activity.entity';
import { User } from '../entity/user.entity';
import { Comment } from '../entity/comment.entity';

@Provide()
export class ActivityService {
  @InjectEntityModel(Activity)
  activityRepo: Repository<Activity>;

  @InjectEntityModel(User)
  userRepo: Repository<User>;

  @InjectEntityModel(Comment)
  commentRepo: Repository<Comment>;

  // 创建活动
  async createActivity(activityData: any) {
    const creator = await this.userRepo.findOneBy({
      id: activityData.creatorId,
    });
    if (!creator) {
      throw new Error('创建者不存在');
    }

    const activity = this.activityRepo.create({
      ...activityData,
      creator: creator,
    });

    const savedActivity = await this.activityRepo.save(activity);
    return { success: true, data: savedActivity };
  }

  // 获取活动列表
  async getActivities(
    page = 1,
    limit = 20,
    type?: ActivityType,
    keyword?: string,
    sortBy = 'createTime', // ✅ 新增排序字段参数
    sortOrder: 'ASC' | 'DESC' = 'DESC' // ✅ 新增排序方向参数
  ) {
    // 参数验证
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100; // 限制最大每页数量

    const offset = (page - 1) * limit;

    const queryBuilder = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.creator', 'creator')
      .leftJoinAndSelect('activity.participants', 'participants')
      .leftJoinAndSelect('activity.favoritedBy', 'favoritedBy');

    // 类型过滤
    if (type) {
      queryBuilder.andWhere('activity.type = :type', { type });
    }

    // 关键词搜索
    if (keyword && keyword.trim()) {
      queryBuilder.andWhere(
        '(activity.title LIKE :keyword OR activity.profile LIKE :keyword OR activity.organizerName LIKE :keyword OR activity.location LIKE :keyword)',
        { keyword: `%${keyword.trim()}%` }
      );
    }

    // ✅ 动态排序
    const allowedSortFields = [
      'createTime',
      'title',
      'activityTime',
      'participantsLimit',
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createTime';

    queryBuilder.orderBy(`activity.${validSortBy}`, sortOrder);

    const [activities, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  // 获取单个活动详情
  async getActivityById(id: string) {
    return await this.activityRepo.findOne({
      where: { id },
      relations: ['participants', 'favoritedBy', 'creator', 'comments'], // 添加 creator 关系
    });
  }

  // 获取用户创建的活动
  async getActivitiesByCreator(creatorId: number) {
    const activities = await this.activityRepo.find({
      where: { creator: { id: creatorId } },
      relations: ['participants', 'favoritedBy', 'creator'],
    });

    return {
      activities,
      total: activities.length,
    };
  }

  // 检查用户是否可以编辑活动
  async canUserEditActivity(
    userId: number,
    activityId: string
  ): Promise<boolean> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
      relations: ['creator'],
    });

    if (!activity) {
      return false;
    }

    return activity.creator.id === userId;
  }

  // 更新活动信息
  async updateActivity(activityId: string, updateData: any) {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
      relations: ['creator'],
    });

    if (!activity) {
      throw new Error('活动不存在');
    }

    // 更新活动信息
    Object.assign(activity, updateData);
    const updatedActivity = await this.activityRepo.save(activity);
    return { success: true, data: updatedActivity };
  }

  // 删除活动（级联清理所有关联数据）
  async deleteActivity(activityId: string) {
    return await this.activityRepo.manager.transaction(async manager => {
      console.log('开始删除活动:', activityId);
      // 查找活动及其所有关联
      const activity = await manager.findOne(Activity, {
        where: { id: activityId },
        relations: ['comments', 'participants', 'favoritedBy', 'creator'],
      });
      console.log('删除活动前检查:', activity);
      if (!activity) {
        throw new Error('活动不存在');
      }

      // 1. 删除活动的所有评论
      if (activity.comments && activity.comments.length > 0) {
        await manager.delete(Comment, { activity: { id: activityId } });
      }
      console.log('删除评论成功');
      // 2. 清空参与者关系（推荐用关系API）
      if (activity.participants && activity.participants.length > 0) {
        await manager
          .createQueryBuilder()
          .relation(Activity, 'participants')
          .of(activityId)
          .remove(activity.participants.map(p => p.id));
      }
      console.log('清空参与者关系成功');
      // 3. 清空收藏者关系（推荐用关系API）
      if (activity.favoritedBy && activity.favoritedBy.length > 0) {
        await manager
          .createQueryBuilder()
          .relation(Activity, 'favoritedBy')
          .of(activityId)
          .remove(activity.favoritedBy.map(u => u.id));
      }
      console.log('清空收藏者关系成功');
      //4. 删除创建者关系
      if (activity.creator) {
        await manager
          .createQueryBuilder()
          .relation(Activity, 'creator')
          .of(activityId)
          .set(null); // 清除创建者关系
      }
      console.log('清空创建者关系成功');
      // 4. 删除活动本身
      await manager.delete(Activity, { id: activityId });
      console.log('删除活动成功');
      // 5. 删除后确认
      const check = await manager.findOne(Activity, {
        where: { id: activityId },
      });

      return { success: !check };
    });
  }

  // 创建评论
  async createComment(commentData: Partial<Comment>) {
    const comment = this.commentRepo.create(commentData);
    const savedComment = await this.commentRepo.save(comment);
    return { success: true, data: savedComment };
  }

  //报名活动
  async joinActivity(userId: number, activityId: string) {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
      relations: ['participants'],
    });

    const user = await this.userRepo.findOneBy({ id: userId });

    if (!activity) {
      throw new Error('活动不存在');
    }

    if (!user) {
      throw new Error('用户不存在');
    }

    const isAlreadyJoined = activity.participants.some(p => p.id === user.id);
    if (isAlreadyJoined) {
      throw new Error('您已报名此活动');
    }

    if (activity.participants.length >= activity.participantsLimit) {
      throw new Error('活动已满，无法报名');
    }

    activity.participants.push(user);
    const result = await this.activityRepo.save(activity);
    return { success: true, data: result };
  }

  //取消报名
  async leaveActivity(userId: number, activityId: string) {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
      relations: ['participants'],
    });

    const user = await this.userRepo.findOneBy({ id: userId });

    if (!activity) {
      throw new Error('活动不存在');
    }

    if (!user) {
      throw new Error('用户不存在');
    }

    const index = activity.participants.findIndex(p => p.id === user.id);
    if (index === -1) {
      throw new Error('您未报名此活动');
    }

    activity.participants.splice(index, 1);
    const result = await this.activityRepo.save(activity);
    return { success: true, data: result };
  }

  //收藏活动
  async favouriteActivity(userId: number, activityId: string) {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
      relations: ['favoritedBy'],
    });

    const user = await this.userRepo.findOneBy({ id: userId });

    if (!activity) {
      throw new Error('活动不存在');
    }
    console.log('活动 favoritedBy:', activity.favoritedBy);
    if (!user) {
      throw new Error('用户不存在');
    }

    if (activity.favoritedBy.some(f => f.id === user.id)) {
      throw new Error('您已收藏此活动');
    }

    activity.favoritedBy.push(user);
    const result = await this.activityRepo.save(activity);
    return { success: true, data: result };
  }

  //取消收藏
  async unfavouriteActivity(userId: number, activityId: string) {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
      relations: ['favoritedBy'],
    });

    const user = await this.userRepo.findOneBy({ id: userId });

    if (!activity) {
      throw new Error('活动不存在');
    }

    if (!user) {
      throw new Error('用户不存在');
    }

    const index = activity.favoritedBy.findIndex(f => f.id === user.id);
    if (index === -1) {
      throw new Error('您未收藏此活动');
    }

    activity.favoritedBy.splice(index, 1);
    const result = await this.activityRepo.save(activity);
    return { success: true, data: result };
  }
}
