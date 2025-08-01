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
}
@ApiTags(['comment'])
@Controller('/comment')
export class CreateCommentController {
  @Inject()
  activityService: ActivityService;

  @Post()
  @Validate()
  async createComment(@Body() commentDTO: CommentDTO) {
    const { content, picture, user, activity, starNumber } = commentDTO;
    const newComment: Partial<Comment> = {
      content,
      picture,
      user,
      activity,
      starNumber,
    };
    return await this.activityService.createComment(newComment);
  }
}
