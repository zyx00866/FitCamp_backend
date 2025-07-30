import * as request from 'supertest';
import { createApp } from '@midwayjs/mock';

describe('报名活动 API', () => {
  let app;
  let server;
  let token: string;
  let userId: number;
  let activityId: string;

  beforeAll(async () => {
    app = await createApp(process.cwd());
    server = app.callback();

    // 注册活动创建者
    const creatorAccount = `creator_${Date.now()}`;
    await request(server)
      .post('/user/register')
      .send({ name: '创建者', password: '123456', account: creatorAccount });
    const creatorLogin = await request(server)
      .post('/user/login')
      .send({ account: creatorAccount, password: '123456' });
    const creatorToken = creatorLogin.body.data.token;
    const creatorId = creatorLogin.body.data.user.id;

    // 创建活动
    const activityRes = await request(server)
      .post('/activity')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: '报名活动',
        profile: 'join test',
        date: new Date(),
        location: 'test',
        picture: '',
        participantsLimit: 10,
        type: '健身',
        organizerName: 'joiner',
        fee: 0,
        createTime: new Date(),
        creatorId: creatorId
      });
    activityId = activityRes.body.data.id;

    // 注册报名者
    const joinerAccount = `joiner_${Date.now()}`;
    await request(server)
      .post('/user/register')
      .send({ name: '报名者', password: '123456', account: joinerAccount });
    const joinerLogin = await request(server)
      .post('/user/login')
      .send({ account: joinerAccount, password: '123456' });
    token = joinerLogin.body.data.token;
    userId = joinerLogin.body.data.user.id;
  });

  afterAll(async () => {
    if (app && app.close) await app.close();
    if (server && server.close) server.close();
  });

  it('报名活动成功', async () => {
    const res = await request(server)
      .post('/activity/signup')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, activityId });
    expect(res.body.success).toBe(true);
  });

  it('重复报名活动应失败', async () => {
    const res = await request(server)
      .post('/activity/signup')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, activityId });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/已报名|重复/);
  });

  it('取消报名成功', async () => {
    const res = await request(server)
      .post('/activity/leave')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, activityId });
    expect(res.body.success).toBe(true);
  });

  it('取消报名失败（未报名）', async () => {
    const res = await request(server)
      .post('/activity/leave')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, activityId });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未报名|不存在/);
  });

});