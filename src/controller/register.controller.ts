import { Post, Controller } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';

@ApiTags('user')
@Controller('/user')
export class RegisterController {
  @Post('/register')
  async register() {}
}
