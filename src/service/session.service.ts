// src/service/session.service.ts
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../entity/userSession.entity';
import { User } from '../entity/user.entity';

@Provide()
export class SessionService {
  @InjectEntityModel(UserSession)
  sessionRepository: Repository<UserSession>;

  @InjectEntityModel(User)
  userRepository: Repository<User>;

  /**
   * 创建用户会话
   */
  async createSession(
    userId: number,
    token: string,
    deviceInfo?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<UserSession> {
    const session = this.sessionRepository.create({
      userId,
      token,
      deviceInfo,
      userAgent,
      ipAddress,
      isActive: true,
    });

    const savedSession = await this.sessionRepository.save(session);

    // 更新用户在线状态
    await this.userRepository.update(userId, {
      isOnline: true,
      lastActiveTime: new Date(),
    });

    return savedSession;
  }

  /**
   * 验证会话是否有效
   */
  async validateSession(token: string): Promise<UserSession | null> {
    const session = await this.sessionRepository.findOne({
      where: { token, isActive: true },
      relations: ['user'],
    });

    if (session) {
      // 更新最后活跃时间
      await this.updateSessionActivity(session.id);
      await this.userRepository.update(session.userId, {
        lastActiveTime: new Date(),
      });
    }

    return session;
  }

  /**
   * 更新会话活跃时间
   */
  async updateSessionActivity(sessionId: number): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      lastActiveTime: new Date(),
    });
  }

  /**
   * 登出会话
   */
  async logoutSession(token: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { token, isActive: true },
    });

    if (session) {
      await this.sessionRepository.update(session.id, {
        isActive: false,
        logoutTime: new Date(),
      });

      // 检查用户是否还有其他活跃会话
      const activeSessions = await this.sessionRepository.count({
        where: { userId: session.userId, isActive: true },
      });

      // 如果没有其他活跃会话，设置用户为离线
      if (activeSessions === 0) {
        await this.userRepository.update(session.userId, {
          isOnline: false,
        });
      }
    }
  }

  /**
   * 获取用户的所有活跃会话
   */
  async getUserActiveSessions(userId: number): Promise<UserSession[]> {
    return await this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { lastActiveTime: 'DESC' },
    });
  }

  /**
   * 获取所有在线用户
   */
  async getOnlineUsers(): Promise<User[]> {
    return await this.userRepository.find({
      where: { isOnline: true },
      select: ['id', 'name', 'account', 'avatar', 'lastActiveTime'],
      order: { lastActiveTime: 'DESC' },
    });
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<void> {
    const expiredTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30天前

    // 找到过期的会话
    const expiredSessions = await this.sessionRepository.find({
      where: { lastActiveTime: { $lt: expiredTime } as any },
    });

    for (const session of expiredSessions) {
      await this.logoutSession(session.token);
    }
  }

  /**
   * 强制用户下线
   */
  async forceUserOffline(userId: number): Promise<void> {
    await this.sessionRepository.update(
      { userId, isActive: true },
      { isActive: false, logoutTime: new Date() }
    );

    await this.userRepository.update(userId, {
      isOnline: false,
    });
  }
}
