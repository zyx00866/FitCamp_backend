import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { Comment } from '../entity/comment.entity';
import { Activity } from '../entity/activity.entity';
import { UserSession } from '../entity/userSession.entity';
import { JwtService } from '@midwayjs/jwt';
import { SessionService } from './session.service';

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userRepository: Repository<User>;

  @InjectEntityModel(Comment)
  commentRepository: Repository<Comment>;

  @InjectEntityModel(Activity)
  activityRepository: Repository<Activity>;

  @InjectEntityModel(UserSession)
  sessionRepository: Repository<UserSession>;

  @Inject()
  jwtService: JwtService;

  @Inject()
  sessionService: SessionService;

  //注册用户
  async register(account: string, password: string, name: string) {
    const existing = await this.userRepository.findOneBy({ account });
    if (existing) {
      throw new Error('用户名已经存在');
    }
    const user = this.userRepository.create({ account, password, name });
    return await this.userRepository.save(user);
  }

  /**
   * 用户注销 - 级联删除关联数据
   */
  async unregister(userId: number) {
    return await this.userRepository.manager.transaction(async manager => {
      try {
        // 1. 检查用户是否存在
        const user = await manager.findOne(User, { where: { id: userId } });
        if (!user) {
          throw new Error('用户不存在');
        }

        console.log(`🗑️ 开始删除用户: ${user.name} (ID: ${userId})`);

        // 2. 删除用户的所有评论
        const deletedComments = await manager.delete(Comment, {
          user: { id: userId },
        });
        console.log(`✅ 删除了 ${deletedComments.affected} 条用户评论`);

        // 3. 删除用户的所有会话（如果存在）
        try {
          const deletedSessions = await manager.delete(UserSession, { userId });
          console.log(`✅ 删除了 ${deletedSessions.affected} 个会话`);
        } catch (error) {
          console.log(`⚠️ 会话表可能不存在，跳过会话删除`);
        }

        // 4. 获取用户创建的活动并处理关联数据
        const userActivities = await manager.find(Activity, {
          where: { creator: { id: userId } },
          relations: ['comments', 'participants', 'favoritedBy'],
        });

        for (const activity of userActivities) {
          console.log(`🔄 处理活动: ${activity.title} (ID: ${activity.id})`);

          // 删除该活动的所有评论（包括其他用户的评论）
          const activityComments = await manager.delete(Comment, {
            activity: { id: activity.id },
          });
          console.log(`  ✅ 删除了活动评论: ${activityComments.affected} 条`);

          // 清空活动的参与者关系（多对多关系表）
          if (activity.participants && activity.participants.length > 0) {
            activity.participants = [];
            await manager.save(Activity, activity);
            console.log(`  ✅ 清空了活动参与者关系`);
          }

          // 清空活动的收藏者关系（多对多关系表）
          if (activity.favoritedBy && activity.favoritedBy.length > 0) {
            activity.favoritedBy = [];
            await manager.save(Activity, activity);
            console.log(`  ✅ 清空了活动收藏者关系`);
          }
        }

        // 5. 现在可以安全删除用户创建的活动
        if (userActivities.length > 0) {
          const deletedActivities = await manager.delete(Activity, {
            creator: { id: userId },
          });
          console.log(
            `✅ 删除了 ${deletedActivities.affected} 个用户创建的活动`
          );
        }

        // 6. 从其他活动的参与者中移除该用户
        const participatedActivities = await manager
          .createQueryBuilder(Activity, 'activity')
          .innerJoin('activity.participants', 'participant')
          .where('participant.id = :userId', { userId })
          .getMany();

        for (const activity of participatedActivities) {
          // 使用查询构建器移除参与关系
          await manager
            .createQueryBuilder()
            .relation(Activity, 'participants')
            .of(activity.id)
            .remove(userId);

          console.log(`  ✅ 从活动 "${activity.title}" 中移除参与关系`);
        }

        console.log(
          `✅ 从 ${participatedActivities.length} 个活动中移除参与记录`
        );

        // 7. 从其他活动的收藏者中移除该用户
        const favoriteActivities = await manager
          .createQueryBuilder(Activity, 'activity')
          .innerJoin('activity.favoritedBy', 'favoriter')
          .where('favoriter.id = :userId', { userId })
          .getMany();

        for (const activity of favoriteActivities) {
          // 使用查询构建器移除收藏关系
          await manager
            .createQueryBuilder()
            .relation(Activity, 'favoritedBy')
            .of(activity.id)
            .remove(userId);

          console.log(`  ✅ 从活动 "${activity.title}" 中移除收藏关系`);
        }

        console.log(`✅ 从 ${favoriteActivities.length} 个收藏列表中移除记录`);

        // 8. 最后删除用户
        await manager.delete(User, { id: userId });
        console.log(`✅ 成功删除用户: ${user.name}`);

        return {
          success: true,
          message: '用户注销成功',
        };
      } catch (error) {
        console.error('❌ 用户注销失败:', error);
        throw error;
      }
    });
  }

  /**
   * 用户登录 - 支持多用户并发
   */
  async login(
    account: string,
    password: string,
    deviceInfo?: string,
    userAgent?: string,
    ipAddress?: string
  ) {
    // 验证用户名密码
    const user = await this.userRepository.findOne({
      where: { account },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (password !== user.password) {
      throw new Error('密码错误');
    }

    // ✅ 生成JWT token
    const token = await this.jwtService.sign({
      userId: user.id,
      account: user.account,
      name: user.name,
      loginTime: Date.now(),
    });

    // ✅ 创建会话记录
    const session = await this.sessionService.createSession(
      user.id,
      token,
      deviceInfo,
      userAgent,
      ipAddress
    );

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;

    return {
      success: true,
      data: {
        user: { ...userInfo, isOnline: true },
        token: token,
        sessionId: session.id,
      },
    };
  }

  /**
   * 用户登出
   */
  async logout(token: string) {
    await this.sessionService.logoutSession(token);

    return {
      success: true,
      message: '登出成功',
    };
  }

  /**
   * 获取在线用户列表
   */
  async getOnlineUsers() {
    const onlineUsers = await this.sessionService.getOnlineUsers();

    return {
      success: true,
      data: {
        users: onlineUsers,
        total: onlineUsers.length,
      },
    };
  }

  /**
   * 获取用户详细信息
   */
  async getUserInfo(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'sessions',
        'activities',
        'favoriteActivities',
        'comments',
        'createdActivities',
      ],
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      data: user,
    };
  }

  //更新用户头像
  async updateAvatar(id: number, avatar: string) {
    const user = await this.userRepository.findOneBy({ id });
    user.avatar = avatar;
    return await this.userRepository.save(user);
  }
  //更新用户用户名和简介
  async updateProfile(id: number, data: Partial<User>) {
    const user = await this.userRepository.findOneBy({ id });
    Object.assign(user, data);
    return await this.userRepository.save(user);
  }

  /**
   * 验证用户密码
   */
  async validatePassword(userId: number, password: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'password'],
      });

      if (!user) {
        return false;
      }

      // 直接比较明文密码
      return user.password === password;
    } catch (error) {
      console.error('密码验证失败:', error);
      return false;
    }
  }
}
