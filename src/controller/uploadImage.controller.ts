import { Post, Controller, Files, Fields } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';
import { join, extname } from 'path';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  unlinkSync,
} from 'fs';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('image')
@Controller('/image')
export class UploadImageController {
  @Post()
  async uploadImage(@Files() files: any[], @Fields() fields: any) {
    try {
      // 检查是否有文件上传
      if (!files || files.length === 0) {
        return {
          success: false,
          message: '请选择要上传的图片',
          data: null,
        };
      }

      const file = files[0]; // 取第一个文件
      console.log('📄 上传的文件:', file);
      // 从 fields 中获取分类参数
      const category = fields?.category || 'other';
      console.log('📂 分类:', category);

      // 验证文件类型
      const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
      const fileExt = extname(file.filename).toLowerCase();

      if (!allowedTypes.includes(fileExt)) {
        return {
          success: false,
          message: '只支持上传 jpg、jpeg、png、gif格式的图片',
          data: null,
        };
      }

      // 验证文件大小 (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.data.length > maxSize) {
        return {
          success: false,
          message: '图片大小不能超过10MB',
          data: null,
        };
      }

      // 根据分类创建不同的存储路径
      const categoryPath = this.getCategoryPath(category);
      const uploadDir = join(process.cwd(), 'data', 'pictures', categoryPath);

      // 确保目录存在
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
        console.log('✅ 创建目录:', uploadDir);
      }

      // 生成唯一文件名
      const fileName = `${uuidv4()}${fileExt}`;
      const finalPath = join(uploadDir, fileName);

      console.log('📄 最终保存路径:', finalPath);

      // 复制临时文件到目标路径
      const readStream = createReadStream(file.data); // file.data 是临时文件路径
      const writeStream = createWriteStream(finalPath);

      // 复制文件
      readStream.pipe(writeStream);

      // 等待复制完成
      await new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          console.log('✅ 文件复制完成');

          // 删除临时文件
          try {
            unlinkSync(file.data);
            console.log('🗑️ 临时文件已删除:', file.data);
          } catch (error) {
            console.warn('⚠️ 删除临时文件失败:', error.message);
          }

          resolve(null);
        });
        writeStream.on('error', reject);
        readStream.on('error', reject);
      });

      // 生成访问路径
      const relativePath = `/static/${categoryPath}/${fileName}`;

      return {
        success: true,
        message: '图片上传成功',
        data: {
          filename: fileName,
          originalName: file.filename,
          path: relativePath,
          category: category,
          mimeType: file.mimeType,
          url: `http://localhost:7001${relativePath}`,
        },
      };
    } catch (error) {
      console.error('上传图片错误:', error);
      return {
        success: false,
        message: '上传失败',
        data: null,
      };
    }
  }

  /**
   * 根据分类获取存储路径
   */
  private getCategoryPath(category: string): string {
    const categoryMap: { [key: string]: string } = {
      avatar: 'avatars',
      activity: 'activities',
      comment: 'comments',
    };

    return categoryMap[category];
  }
}
