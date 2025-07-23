import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import * as swagger from '@midwayjs/swagger';
import { join } from 'path';
import * as typeorm from '@midwayjs/typeorm';
import { ReportMiddleware } from './middleware/report.middleware';
import { JWTMiddleware } from './middleware/jwt.middleware';
import * as cors from '@koa/cors';
import * as jwt from '@midwayjs/jwt';
import * as upload from '@midwayjs/upload';
import * as staticFile from '@midwayjs/static-file';
@Configuration({
  imports: [
    koa,
    validate,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
    swagger,
    typeorm,
    cors,
    jwt,
    upload,
    staticFile,
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  async onReady() {
    this.app.use(
      cors({
        origin: '*', // 允许所有来源
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'], // 允许的请求头
        maxAge: 3600, // 预检请求的缓存时间
      })
    );
    // add middleware
    this.app.useMiddleware([ReportMiddleware, JWTMiddleware]);
  }
}
