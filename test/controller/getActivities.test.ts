import * as request from 'supertest';
import { createApp } from '@midwayjs/mock';

describe('获取活动信息 API', () => {
  let app;
  let server;
  let token: string;
  let userId: number;
  let activityId: string;

  beforeAll(async () => {
    app = await createApp(process.cwd());
    server = app.callback();

    // 注册用户
    const testAccount = `getuser_${Date.now()}`;
    await request(server)
      .post('/user/register')
      .send({ name: '活动查询用户', password: '123456', account: testAccount });

    // 登录获取 token 和 userId
    const loginRes = await request(server)
      .post('/user/login')
      .send({ account: testAccount, password: '123456' });
    token = loginRes.body.data.token;
    userId = loginRes.body.data.user.id;

    // 创建活动
    const activityRes = await request(server)
      .post('/activity')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '查询活动',
        profile: 'get test',
        date: new Date(),
        location: 'test',
        picture: '',
        participantsLimit: 10,
        type: '游泳',
        organizerName: 'getter',
        fee: 0,
        createTime: new Date(),
        creatorId: userId
        });
      
    activityId = activityRes.body.data.id;
  });

  afterAll(async () => {
    if (app && app.close) await app.close();
    if (server && server.close) server.close();
  });

  it('获取所有活动列表', async () => {
    const res = await request(server)
      .get('/activity/list')
      .query({ page: 1, limit: 20 })
      
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(true);
  });

  it('根据ID获取单个活动详情', async () => {
    const res = await request(server)
      .get('/activity/detail')
      .query({ id: activityId })
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(true);
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.id).toBe(activityId);
  });

  it('根据关键词搜索活动', async () => {
    const res = await request(server)
      .get('/activity/list')
      .query({ keyword: '查询活动', page: 1, limit: 20 })
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(true);

    // 打印返回结构，便于调试
    console.log('关键词搜索返回:', res.body);

    // 取 activities 数组
    const list = res.body.data.activities;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some(item => item.title === '查询活动')).toBe(true);
  });
});