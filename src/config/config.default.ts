import { MidwayConfig } from '@midwayjs/core';

export default {
  typeorm: {
    type: 'sqlite',
    database: '/data/fitcamp.sqlite',
    synchronize: true,
    logging: true,
    entities: ['src/entity/**/*.ts'],
  },
  swagger: {
    title: 'FitCamp API',
    description: '暑期课程大作业体育活动室后端接口文档',
    version: '1.0.0',
    include: ['src/controller'],
  },
  koa: {
    port: 7001,
  },
  keys: 'temp',
} as MidwayConfig;
