import { Get, Controller } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';

@ApiTags('home')
@Controller('/')
export class HomeController {
  @Get('/')
  async index() {
    return {
      success: true,
      message: '欢迎使用 FitCamp 后端服务',
      data: null,
    };
  }
}
