import { Provide, Config } from '@midwayjs/core';
import { IMiddleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import * as jwt from 'jsonwebtoken';

@Provide()
export class JWTMiddleware implements IMiddleware<Context, NextFunction> {
  @Config('jwt')
  jwtConfig: {
    secret: string;
    expiresIn: string;
  };

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 白名单路由，不需要验证JWT
      const whiteList = ['/user/register', '/swagger-ui', '/user/login'];

      // 检查是否在白名单中
      const isInWhiteList = whiteList.some(
        path => ctx.path === path || ctx.path.startsWith(path)
      );

      if (isInWhiteList) {
        await next();
        return;
      }
      // 从请求头中获取token
      const authorization = ctx.headers.authorization;

      if (!authorization) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: '未提供认证token',
          data: null,
        };
        return;
      }

      // 验证token格式 (Bearer token)
      const parts = authorization.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: 'token格式错误，应为: Bearer <token>',
          data: null,
        };
        return;
      }

      const token = parts[1];

      try {
        // 验证token
        const decoded = jwt.verify(token, this.jwtConfig.secret) as any;

        // 只存储确定存在的id
        ctx.state.user = {
          id: decoded.id,
        };
        await next();
      } catch (error) {
        ctx.status = 401;

        let message = 'token验证失败';
        if (error.name === 'TokenExpiredError') {
          message = 'token已过期，请重新登录';
        } else if (error.name === 'JsonWebTokenError') {
          message = 'token无效';
        } else if (error.name === 'NotBeforeError') {
          message = 'token尚未生效';
        }

        ctx.body = {
          success: false,
          message,
          data: null,
        };
      }
    };
  }

  static getName(): string {
    return 'jwt';
  }
}
