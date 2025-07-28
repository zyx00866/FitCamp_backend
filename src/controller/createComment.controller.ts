import { Post, Controller, Inject, Body } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { ActivityService } from '../service/activity.service';
import { Validate } from '@midwayjs/validate';
import { User } from '../entity/user.entity';
import { Activity } from '../entity/activity.entity';
import { Comment } from '../entity/comment.entity';

export class CommentDTO {
  content: string;
  picture?: string;
  user: User;
  activity: Activity;
  starNumber: number;
  createTime: Date;
}
@ApiTags(['comment'])
@Controller('/comment')
export class CreateCommentController {
  @Inject()
  activityService: ActivityService;

  @Post('/create')
  @Validate()
  async createComment(@Body() commentDTO: CommentDTO) {
    const { content, picture, user, activity, starNumber, createTime } =
      commentDTO;
    const newComment: Partial<Comment> = {
      content,
      picture,
      user,
      activity,
      starNumber,
      createTime,
    };
    return await this.activityService.createComment(newComment);
  }
}
