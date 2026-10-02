import { db } from '@/server/db';
import { getCurrentStaff } from '@/server/auth/session';

// Serves the shop's DuitNow QR to signed-in staff (the payment screen shows it to customers).
export async function GET() {
  if (!(await getCurrentStaff())) return new Response('Unauthorized', { status: 401 });

  const settings = await db.query.shopSettings.findFirst({ columns: { duitnowQrImage: true, duitnowQrType: true } });
  if (!settings?.duitnowQrImage || !settings.duitnowQrType) return new Response('Not found', { status: 404 });

  return new Response(new Uint8Array(settings.duitnowQrImage), {
    headers: {
      'Content-Type': settings.duitnowQrType,
      // Always re-check: the owner may replace the QR at any time.
      'Cache-Control': 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
