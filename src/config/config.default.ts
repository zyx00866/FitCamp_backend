import { MidwayConfig } from '@midwayjs/core';
import { User } from '../entity/user.entity';
import { Activity } from '../entity/activity.entity';
import { Comment } from '../entity/comment.entity';
import { UserSession } from '../entity/userSession.entity';

export default {
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: './data/fitcamp.sqlite',
        synchronize: true,
        logging: true,
        entities: [User, Activity, Comment, UserSession],
        extra: {
          busyTimeout: 10000, // 设置忙等待超时时间，单位为毫秒
        },
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

  jwt: {
    secret: 'test',
    expiresIn: '1d',
  },

  upload: {
    mode: 'file',
    fileSize: '10mb',
    fileExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
    tmpdir: './data/tempImages',
  },

  staticFile: {
    dirs: {
      default: {
        prefix: '/static/',
        dir: './data/pictures',
        gzip: true,
      },
    },
  },
  keys: 'temp',
} as MidwayConfig;
