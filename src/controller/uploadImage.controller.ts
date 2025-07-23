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

@ApiTags('upload')
@Controller('/upload')
export class UploadImageController {
  @Post('/image')
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

      // 生成唯一文件名
      const fileName = `${uuidv4()}${fileExt}`;
      const finalPath = join(uploadDir, fileName);

      console.log('📄 最终保存路径:', finalPath);

      //复制临时文件到目标路径
      const readStream = createReadStream(file.data); // file.data 是临时文件路径
      const writeStream = createWriteStream(finalPath);

      // 复制文件
      readStream.pipe(writeStream);

      // 等待复制完成
      await new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          console.log('文件复制完成');

          // 删除临时文件
          try {
            unlinkSync(file.data);
            console.log('临时文件已删除:', file.data);
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

  @Post('/images/batch')
  async uploadImages(@Files() files: any[], @Fields() fields: any) {
    try {
      console.log('📁 接收到的文件数组:', files);
      console.log('📁 文件数量:', files?.length || 0);

      if (!files || files.length === 0) {
        return {
          success: false,
          message: '请选择要上传的图片',
          data: null,
        };
      }

      const category = fields?.category || 'other';
      const uploadResults = [];

      // 遍历所有上传的文件
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📄 处理第 ${i + 1} 个文件:`, file.filename);

        // 验证文件类型
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
        const fileExt = extname(file.filename).toLowerCase();

        if (!allowedTypes.includes(fileExt)) {
          uploadResults.push({
            filename: file.filename,
            success: false,
            message: '文件类型不支持',
          });
          continue;
        }

        // 验证文件大小
        const maxSize = 10 * 1024 * 1024;
        if (file.data.length > maxSize) {
          uploadResults.push({
            filename: file.filename,
            success: false,
            message: '文件大小超过限制',
          });
          continue;
        }

        try {
          const categoryPath = this.getCategoryPath(category);
          const uploadDir = join(
            process.cwd(),
            'data',
            'pictures',
            categoryPath
          );

          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }

          const fileName = `${uuidv4()}${fileExt}`;
          const filePath = join(uploadDir, fileName);

          const writeStream = createWriteStream(filePath);
          writeStream.write(file.data);
          writeStream.end();

          await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });

          const relativePath = `/static/${categoryPath}/${fileName}`;

          uploadResults.push({
            filename: fileName,
            originalName: file.filename,
            path: relativePath,
            category: category,
            size: file.data.length,
            success: true,
            url: `http://localhost:7001${relativePath}`,
          });

          console.log(`✅ 第 ${i + 1} 个文件上传成功`);
        } catch (error) {
          console.error(`❌ 第 ${i + 1} 个文件上传失败:`, error);
          uploadResults.push({
            filename: file.filename,
            success: false,
            message: '上传失败',
          });
        }
      }

      return {
        success: true,
        message: `批量上传完成，成功：${
          uploadResults.filter(r => r.success).length
        }，失败：${uploadResults.filter(r => !r.success).length}`,
        data: uploadResults,
      };
    } catch (error) {
      console.error('批量上传错误:', error);
      return {
        success: false,
        message: '批量上传失败',
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
