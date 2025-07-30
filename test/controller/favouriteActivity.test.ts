import * as request from 'supertest';
import { createApp } from '@midwayjs/mock';
import { exit } from 'process';

describe('收藏/取消收藏活动 API', () => {
  let app;
  let server;
  let token: string;
  let userId: number;
  let activityId: string;

  beforeAll(async () => {
    app = await createApp(process.cwd());
    server = app.callback();

    // 注册用户
    const testAccount = `testuser_${Date.now()}`;
    const regRes = await request(server)
      .post('/user/register')
      .send({ name: 'test', password: '123456', account: testAccount });
    expect(regRes.body.success).toBe(true);
    console.log('注册返回:', regRes.body);

    // 登录获取 token 和 userId
    const loginRes = await request(server)
      .post('/user/login')
      .send({ account: testAccount, password: '123456' });
    expect(loginRes.body.success).toBe(true);

    token = loginRes.body.data.token;
    userId = loginRes.body.data.user.id;

    // 创建活动
    const activityRes = await request(server)
      .post('/activity')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '测试活动',
        profile: 'test',
        date: new Date(),
        location: 'test',
        picture: '',
        participantsLimit: 10,
        type: '健身',
        organizerName: 'test',
        fee: 0,
        createTime: new Date(),
        creatorId: userId
      });
    console.log('活动创建返回:', activityRes.body);
    expect(activityRes.body.success).toBe(true);
    expect(activityRes.body.data).not.toBeNull();
    activityId = activityRes.body.data.id;
  });

  afterAll(async () => {
    if (app && app.close) await app.close();
    if (server && server.close) server.close();
  });

  it('收藏活动成功', async () => {
    const res = await request(server)
      .post('/activity/favourite')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, activityId });
    expect(res.body.success).toBe(true);
  });

  it('重复收藏活动应失败', async () => {
    // 再次收藏同一个活动
    const res = await request(server)
      .post('/activity/favourite')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, activityId });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/已收藏|重复/);
  });

  it('取消收藏活动成功', async () => {
    const res = await request(server)
      .post('/activity/unfavourite')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, activityId });
    expect(res.body.success).toBe(true);
  });

  it('取消收藏活动失败（未收藏）', async () => {
    // 再次取消同一个活动
    const res = await request(server)
      .post('/activity/unfavourite')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, activityId });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未收藏|不存在/);
  });

});