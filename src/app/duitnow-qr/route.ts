import { db } from '@/server/db';
import { getCurrentStaff } from '@/server/auth/session';
import { readImage } from '@/server/uploads';

// Serves the shop's DuitNow QR to signed-in staff (the payment screen shows it to customers).
export async function GET() {
  if (!(await getCurrentStaff())) return new Response('Unauthorized', { status: 401 });

  const settings = await db.query.shopSettings.findFirst({ columns: { duitnowQrPath: true } });
  const image = settings?.duitnowQrPath ? await readImage(settings.duitnowQrPath) : null;
  if (!image) return new Response('Not found', { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      'Content-Type': image.contentType,
      // Always re-check: the owner may replace the QR at any time.
      'Cache-Control': 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
