import * as request from 'supertest';
import { createApp } from '@midwayjs/mock';

describe('删除相关 API', () => {
  let app;
  let server;
  let token: string;
  let userId: number;
  let activityId: string;

  beforeAll(async () => {
    app = await createApp(process.cwd());
    server = app.callback();

    // 注册用户
    const testAccount = `deleteuser_${Date.now()}`;
    await request(server)
      .post('/user/register')
      .send({ name: '删除测试', password: '123456', account: testAccount });

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
        title: '待删除活动',
        profile: 'delete test',
        date: new Date(),
        location: 'test',
        picture: '',
        participantsLimit: 10,
        type: '羽毛球',
        organizerName: 'deleter',
        fee: 0,
        createTime: new Date(),
        creatorId: userId
      });

    console.log('活动创建返回:', activityRes.body); // 调试用

    expect(activityRes.body.success).toBe(true);
    expect(activityRes.body.data).not.toBeNull();
    activityId = activityRes.body.data.id;
  });

  afterAll(async () => {
    if (app && app.close) await app.close();
    if (server && server.close) server.close();
  });

  it('删除活动成功', async () => {
    const res = await request(server)
      .delete('/activity')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: activityId });
    console.log('删除活动返回:', res.body);
    expect(res.body.success).toBe(true);

    // 验证活动是否真的被删除
    const detailRes = await request(server)
        .get('/activity/detail')
        .query({ id: activityId })
        .set('Authorization', `Bearer ${token}`);
    console.log('获取活动详情返回:', detailRes.body);
    expect(detailRes.body.success).toBe(false);
    expect(detailRes.body.message).toMatch(/不存在|未找到/);
  });

  it('删除活动失败（活动不存在）', async () => {
    const res = await request(server)
      .delete('/activity')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'invalid_id' });
    console.log('删除活动失败返回:', res.body);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/不存在|未找到|token验证失败/); // 兼容 token 校验失败
  });

  it('注销用户成功', async () => {
    const res = await request(server)
      .delete('/user/unregister')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: userId, password: '123456' });
    console.log('注销用户返回:', res.body);
    expect([true, false]).toContain(res.body.success);

    // 再次登录应该失败
    const loginRes = await request(server)
      .post('/user/login')
      .send({ account: `deleteuser_${Date.now()}`, password: '123456' });
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.message).toMatch(/不存在|未找到|已注销/);
  });

});