import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { ActivityService } from '../service/activity.service';
import { Validate } from '@midwayjs/validate';
import { ActivityType } from '../entity/activity.entity';

export class ActivityDTO {
  title: string;
  profile: string;
  date: Date;
  location: string;
  picture: string; //sqlite 不支持数组，这里使用字符串存储图片链接，链接之间用逗号分隔
  participantsLimit: number;
  type: ActivityType;
  organizerName: string;
  organizerId: number;
}

@ApiTags(['activity'])
@Controller('/activity')
export class CreateActivityController {
  @Inject()
  activityService: ActivityService;

  @Post('/create')
  @Validate()
  async createActivity(@Body() activityDTO: ActivityDTO) {
    return await this.activityService.createActivity(activityDTO);
  }
}
