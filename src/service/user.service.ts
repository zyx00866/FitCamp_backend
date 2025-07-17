import { Provide } from '@midwayjs/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { User } from '../entity/user.entity';

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userRepo: Repository<User>;

  //注册用户
  async register(account: string, password: string) {
    const existing = await this.userRepo.findOneBy({ account });
    if (existing) {
      throw new Error('用户名已经存在');
    }
    const user = this.userRepo.create({ account, password, name: account });
    return await this.userRepo.save(user);
  }
  //登录用户
  async login(account: string, password: string) {
    const user = await this.userRepo.findOneBy({ account, password });
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    return user;
  }
  //获取用户信息
  async getUserInfo(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['activities', 'favoriteActivities', 'comments'],
    });
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  }
  //更新用户头像
  async updateAvatar(id: number, avatar: string) {
    const user = await this.userRepo.findOneBy({ id });
    user.avatar = avatar;
    return await this.userRepo.save(user);
  }
  //更新用户用户名和简介
  async updateProfile(id: number, data: Partial<User>) {
    const user = await this.userRepo.findOneBy({ id });
    Object.assign(user, data);
    return await this.userRepo.save(user);
  }
}
