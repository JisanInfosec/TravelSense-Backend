import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Stores destination images in Cloudinary using a signed upload.
 * Only the resulting URL is saved in the database.
 */
@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  get enabled() {
    return Boolean(
      this.config.get('CLOUDINARY_CLOUD_NAME') &&
        this.config.get('CLOUDINARY_API_KEY') &&
        this.config.get('CLOUDINARY_API_SECRET'),
    );
  }

  async uploadImage(file: Express.Multer.File | undefined) {
    if (!this.enabled) {
      throw new ServiceUnavailableException(
        'Image uploads are not configured. Add Cloudinary credentials to the backend .env, or paste an image URL instead.',
      );
    }
    if (!file) throw new BadRequestException('Please choose an image to upload.');
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP or AVIF images are allowed.');
    }

    const cloud = this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.getOrThrow<string>('CLOUDINARY_API_KEY');
    const secret = this.config.getOrThrow<string>('CLOUDINARY_API_SECRET');
    const folder = this.config.get<string>('CLOUDINARY_FOLDER', 'travelsense');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest('hex');

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
    form.append('api_key', apiKey);
    form.append('timestamp', timestamp);
    form.append('folder', folder);
    form.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
    const body = (await res.json()) as { secure_url?: string; width?: number; height?: number; error?: { message: string } };
    if (!res.ok || !body.secure_url) {
      throw new BadRequestException(body.error?.message ?? 'The image could not be uploaded.');
    }
    return { url: body.secure_url, width: body.width, height: body.height };
  }
}
