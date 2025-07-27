import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { JwtService } from '@midwayjs/jwt';
import { SessionService } from './session.service';

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userRepository: Repository<User>;

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
}
