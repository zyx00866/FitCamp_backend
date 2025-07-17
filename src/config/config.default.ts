import { MidwayConfig } from '@midwayjs/core';
import { User } from '../entity/user.entity';
import { Activity } from '../entity/activity.entity';
import { Comment } from '../entity/comment.entity';

export default {
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: './data/fitcamp.sqlite',
        synchronize: true,
        logging: true,
        entities: [User, Activity, Comment],
      },
    },
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
