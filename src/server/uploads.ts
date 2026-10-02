import 'server-only';

// Uploaded images (the DuitNow QR) are stored in the database, not on disk: it works the same on the
// shop PC and on Vercel (whose disk is read-only), is included in every database backup, and is only
// reachable through routes that check the session.

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // also under Vercel's 4.5 MB request limit

const IMAGE_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
} as const;
export type ImageContentType = (typeof IMAGE_TYPES)[keyof typeof IMAGE_TYPES];

/** Identify an image by its first bytes — the browser's file name and declared type can't be trusted. */
function sniffImage(bytes: Uint8Array): ImageContentType | null {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return IMAGE_TYPES.png;
  if (startsWith([0xff, 0xd8, 0xff])) return IMAGE_TYPES.jpg;
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return IMAGE_TYPES.webp;
  return null;
}

export class UploadError extends Error {}

/** Validates an uploaded image and returns its bytes and real content type, ready to store. */
export async function readUploadedImage(file: File): Promise<{ bytes: Buffer; contentType: ImageContentType }> {
  if (file.size === 0) throw new UploadError('Choose an image to upload.');
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError('Image is larger than 4 MB. Try a screenshot or a smaller photo.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = sniffImage(bytes);
  if (!contentType) throw new UploadError('Only PNG, JPEG or WebP images are accepted.');
  return { bytes: Buffer.from(bytes), contentType };
}
