'use server';

import { db } from '@/server/db';
import { requireStaff } from '@/server/auth/session';

/**
 * The shop's DuitNow QR as a data URL, for the payment screen and the settings preview.
 * Loaded through a Server Action rather than its own route: on Vercel, route handlers run as a
 * separate function from the pages, and in the self-resetting demo each function has its own copy of
 * the database — so a separate route couldn't see the signed-in session. Actions run with the pages.
 */
export async function loadDuitnowQr(): Promise<string | null> {
  await requireStaff();
  const settings = await db.query.shopSettings.findFirst({ columns: { duitnowQrImage: true, duitnowQrType: true } });
  if (!settings?.duitnowQrImage || !settings.duitnowQrType) return null;
  return `data:${settings.duitnowQrType};base64,${Buffer.from(settings.duitnowQrImage).toString('base64')}`;
}
