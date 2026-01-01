import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

export interface ImageProcessingOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageProcessingService {
  private uploadDir: string;
  private thumbnailDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');
    this.ensureDirectoriesExist();
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectoriesExist(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.thumbnailDir)) {
      fs.mkdirSync(this.thumbnailDir, { recursive: true });
    }
  }

  /**
   * Compress an image while maintaining quality
   */
  async compressImage(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions = {}
  ): Promise<void> {
    try {
      const {
        quality = 85,
        width,
        height,
        format = 'jpeg'
      } = options;

      let pipeline = sharp(inputPath);

      // Resize if dimensions specified
      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Apply format-specific compression
      switch (format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ quality, progressive: true });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
      }

      await pipeline.toFile(outputPath);

      logger.info('Image compressed successfully', {
        inputPath,
        outputPath,
        options
      });
    } catch (error) {
      logger.error('Error compressing image', { error, inputPath, outputPath });
      throw error;
    }
  }

  /**
   * Generate thumbnail for an image
   */
  async generateThumbnail(
    inputPath: string,
    filename: string,
    options: ThumbnailOptions
  ): Promise<string> {
    try {
      const {
        width,
        height,
        quality = 80,
        format = 'jpeg'
      } = options;

      const ext = format === 'jpeg' ? 'jpg' : format;
      const thumbnailFilename = `thumb_${path.parse(filename).name}.${ext}`;
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);

      await sharp(inputPath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality, progressive: true })
        .toFile(thumbnailPath);

      logger.info('Thumbnail generated successfully', {
        inputPath,
        thumbnailPath,
        options
      });

      return thumbnailFilename;
    } catch (error) {
      logger.error('Error generating thumbnail', { error, inputPath, filename });
      throw error;
    }
  }

  /**
   * Generate multiple thumbnail sizes
   */
  async generateMultipleThumbnails(
    inputPath: string,
    filename: string
  ): Promise<{ [size: string]: string }> {
    const thumbnails: { [size: string]: string } = {};

    const sizes = [
      { name: 'small', width: 150, height: 150 },
      { name: 'medium', width: 300, height: 300 },
      { name: 'large', width: 600, height: 600 }
    ];

    for (const size of sizes) {
      try {
        const thumbnailFilename = await this.generateThumbnail(
          inputPath,
          `${size.name}_${filename}`,
          {
            width: size.width,
            height: size.height,
            quality: 80
          }
        );
        thumbnails[size.name] = thumbnailFilename;
      } catch (error) {
        logger.warn(`Failed to generate ${size.name} thumbnail`, { error, filename });
      }
    }

    return thumbnails;
  }

  /**
   * Optimize uploaded image (compress and generate thumbnails)
   */
  async optimizeUploadedImage(
    originalPath: string,
    filename: string
  ): Promise<{
    compressedPath: string;
    thumbnails: { [size: string]: string };
  }> {
    try {
      // Generate compressed version
      const compressedFilename = `compressed_${filename}`;
      const compressedPath = path.join(this.uploadDir, compressedFilename);

      await this.compressImage(originalPath, compressedPath, {
        quality: 85,
        width: 1920, // Max width for compressed version
        height: 1920 // Max height for compressed version
      });

      // Generate thumbnails
      const thumbnails = await this.generateMultipleThumbnails(originalPath, filename);

      logger.info('Image optimization completed', {
        originalPath,
        compressedPath,
        thumbnails
      });

      return {
        compressedPath,
        thumbnails
      };
    } catch (error) {
      logger.error('Error optimizing uploaded image', { error, originalPath, filename });
      throw error;
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imagePath: string): Promise<sharp.Metadata> {
    try {
      return await sharp(imagePath).metadata();
    } catch (error) {
      logger.error('Error getting image metadata', { error, imagePath });
      throw error;
    }
  }

  /**
   * Clean up old thumbnails
   */
  async cleanupOldThumbnails(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const files = fs.readdirSync(this.thumbnailDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.thumbnailDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          cleanedCount++;
          logger.info('Cleaned up old thumbnail', { file });
        }
      }

      logger.info('Thumbnail cleanup completed', { cleanedCount, maxAge });
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up old thumbnails', { error });
      return 0;
    }
  }
}

// Create singleton instance
export const imageProcessingService = new ImageProcessingService();