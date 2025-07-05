import sharp from 'sharp';

// interface
import { ResizeBase64Params } from '@interfaces/images.interface';

export default new class Images {
  async resizeBase64(params: ResizeBase64Params): Promise<string> {
    const desiredWidth = params.width;
    let desiredHeight = 0;

    const imgRaw = Buffer.from(params.imageBuffer, 'base64');

    await sharp(imgRaw)
      .metadata()
      .then((metadata) => {
        const originalWidth = metadata.width || 0;
        const originalHeight = metadata.height || 0;

        desiredHeight = Math.round(
          (desiredWidth / originalWidth) * originalHeight,
        );
      });

    const imgBase64 = await sharp(imgRaw)
      .resize(desiredWidth, desiredHeight)
      .toBuffer();

    return imgBase64.toString('base64');
  }
}