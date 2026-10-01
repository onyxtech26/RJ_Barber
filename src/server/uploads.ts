import 'server-only';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Uploaded files live in data/uploads (gitignored, included in backups' folder), never in public/,
// so they're only reachable through routes that check the session.

const UPLOAD_DIR = path.join('data', 'uploads');
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const IMAGE_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
} as const;
type ImageExt = keyof typeof IMAGE_TYPES;

/** Identify an image by its first bytes — the browser's file name and declared type can't be trusted. */
function sniffImage(bytes: Uint8Array): ImageExt | null {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith([0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  return null;
}

export class UploadError extends Error {}

/** Validates and stores an image, returning its path relative to the project (e.g. data/uploads/duitnow-qr-123.png). */
export async function saveImage(file: File, baseName: string): Promise<string> {
  if (file.size === 0) throw new UploadError('Choose an image to upload.');
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError('Image is larger than 4 MB. Try a screenshot or a smaller photo.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniffImage(bytes);
  if (!ext) throw new UploadError('Only PNG, JPEG or WebP images are accepted.');

  await mkdir(UPLOAD_DIR, { recursive: true });
  const relativePath = path.join(UPLOAD_DIR, `${baseName}-${Date.now()}.${ext}`).replaceAll('\\', '/');
  await writeFile(relativePath, bytes);
  return relativePath;
}

/** Reads a stored image. Refuses anything outside data/uploads, in case a bad path ever got into the DB. */
export async function readImage(relativePath: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  const resolved = path.resolve(relativePath);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) return null;
  const ext = path.extname(resolved).slice(1) as ImageExt;
  if (!(ext in IMAGE_TYPES)) return null;
  try {
    return { bytes: await readFile(resolved), contentType: IMAGE_TYPES[ext] };
  } catch {
    return null;
  }
}

export async function deleteImage(relativePath: string | null | undefined) {
  if (!relativePath) return;
  const resolved = path.resolve(relativePath);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) return;
  await rm(resolved, { force: true });
}
