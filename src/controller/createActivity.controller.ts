import { Post, Controller, Inject, Body, Put, Del } from '@midwayjs/decorator';
import { ApiTags } from '@midwayjs/swagger';
import { ActivityService } from '../service/activity.service';
import { Validate } from '@midwayjs/validate';
import { ActivityType } from '../entity/activity.entity';

export class ActivityDTO {
  id?: string; // 可选，用于更新活动时传入
  title: string;
  profile: string;
  date: Date;
  location: string;
  picture: string; //sqlite 不支持数组，这里使用字符串存储图片链接，链接之间用逗号分隔
  participantsLimit: number;
  type: ActivityType;
  organizerName: string;
  fee: number;
  createTime: Date;
  creatorId: number; // 创建者的用户ID
}

@ApiTags(['activity'])
@Controller('/activity')
export class CreateActivityController {
  @Inject()
  activityService: ActivityService;

  @Post()
  @Validate()
  async createActivity(@Body() activityDTO: ActivityDTO) {
    return await this.activityService.createActivity(activityDTO);
  }

  @Put()
  @Validate()
  async updateActivity(@Body() activityDTO: ActivityDTO) {
    const { id, ...updateData } = activityDTO;
    return await this.activityService.updateActivity(id, updateData);
  }

  @Del()
  @Validate()
  async deleteActivity(@Body() body: { id: string }) {
    const { id } = body;
    return await this.activityService.deleteActivity(id);
  }
}
