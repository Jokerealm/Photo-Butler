export interface UploadResponse {
  success: boolean;
  data?: {
    imageId: string;
    imageUrl: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    dimensions?: {
      width?: number;
      height?: number;
    };
    thumbnails?: { [size: string]: string };
    compressed?: boolean;
  };
  error?: string;
}

export interface UploadedImageInfo {
  id: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB