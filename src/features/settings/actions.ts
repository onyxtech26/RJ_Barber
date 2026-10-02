'use server';

import { refresh } from 'next/cache';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { catalogItems, categories, db, shopSettings, staff } from '@/server/db';
import { logAudit } from '@/server/audit';
import { hashPin, PIN_PATTERN } from '@/server/auth/pin';
import { requireOwner, revokeAllSessions } from '@/server/auth/session';
import { readUploadedImage, UploadError } from '@/server/uploads';
import { ITEM_KINDS, STAFF_ROLES } from '@/lib/enums';
import type { ActionResult } from '@/features/pos/schemas';

const fail = (error: z.ZodError) => ({ ok: false as const, error: error.issues[0]?.message ?? 'Invalid input.' });
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v));
const bps = z.int().min(0).max(10_000);

// ─── Shop ───────────────────────────────────────────────────────────────────────

const shopSchema = z.object({
  name: z.string().trim().min(1, 'Shop name is required.').max(80),
  address: optionalText(200),
  phone: optionalText(30),
  receiptFooter: optionalText(200),
  duitnowAccountName: optionalText(80),
  sstEnabled: z.boolean(),
  sstRateBps: z.int().min(0).max(3000, 'SST rate looks too high.'),
  sstRegNo: optionalText(40),
  discountApprovalThresholdBps: bps,
});

export async function updateShopSettings(input: z.input<typeof shopSchema>): Promise<ActionResult<null>> {
  const me = await requireOwner();
  const parsed = shopSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  if (parsed.data.sstEnabled && !parsed.data.sstRegNo) {
    return { ok: false, error: 'Enter the SST registration number to charge SST.' };
  }

  await db.transaction(async (tx) => {
    await tx.update(shopSettings).set(parsed.data).where(eq(shopSettings.id, 1));
    await logAudit({ actorId: me.id, action: 'settings.updated', entity: 'shop_settings', details: parsed.data }, tx);
  });
  refresh();
  return { ok: true, data: null };
}

export async function uploadDuitnowQr(formData: FormData): Promise<ActionResult<null>> {
  const me = await requireOwner();
  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'Choose an image to upload.' };

  let image: Awaited<ReturnType<typeof readUploadedImage>>;
  try {
    image = await readUploadedImage(file);
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, error: error.message };
    throw error;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(shopSettings)
      .set({ duitnowQrImage: image.bytes, duitnowQrType: image.contentType })
      .where(eq(shopSettings.id, 1));
    await logAudit(
      { actorId: me.id, action: 'settings.updated', entity: 'shop_settings', details: { duitnowQr: 'replaced', bytes: image.bytes.length } },
      tx
    );
  });
  refresh();
  return { ok: true, data: null };
}

export async function removeDuitnowQr(): Promise<ActionResult<null>> {
  const me = await requireOwner();
  await db.transaction(async (tx) => {
    await tx.update(shopSettings).set({ duitnowQrImage: null, duitnowQrType: null }).where(eq(shopSettings.id, 1));
    await logAudit({ actorId: me.id, action: 'settings.updated', entity: 'shop_settings', details: { duitnowQr: 'removed' } }, tx);
  });
  refresh();
  return { ok: true, data: null };
}

// ─── Catalog ────────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  id: z.string().min(1).nullish(),
  name: z.string().trim().min(1, 'Category name is required.').max(40),
  sortOrder: z.int().min(0).max(999),
  isActive: z.boolean(),
});

export async function saveCategory(input: z.input<typeof categorySchema>): Promise<ActionResult<null>> {
  const me = await requireOwner();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const { id, ...values } = parsed.data;

  const clash = await db.query.categories.findFirst({
    where: id ? and(eq(categories.name, values.name), ne(categories.id, id)) : eq(categories.name, values.name),
  });
  if (clash) return { ok: false, error: `A category called “${values.name}” already exists.` };

  await db.transaction(async (tx) => {
    if (id) await tx.update(categories).set(values).where(eq(categories.id, id));
    else await tx.insert(categories).values(values);
    await logAudit({ actorId: me.id, action: 'catalog.updated', entity: 'category', entityId: id ?? undefined, details: values }, tx);
  });
  refresh();
  return { ok: true, data: null };
}

const itemSchema = z.object({
  id: z.string().min(1).nullish(),
  categoryId: z.string().min(1, 'Choose a category.'),
  name: z.string().trim().min(1, 'Name is required.').max(80),
  kind: z.enum(ITEM_KINDS),
  priceSen: z.int().min(0).max(10_000_000),
  commissionBps: bps.nullable(),
  sortOrder: z.int().min(0).max(999),
  isActive: z.boolean(),
});

/** Items are never deleted — old receipts point at them. Hide them with isActive instead. */
export async function saveCatalogItem(input: z.input<typeof itemSchema>): Promise<ActionResult<null>> {
  const me = await requireOwner();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const { id, ...values } = parsed.data;

  const category = await db.query.categories.findFirst({ where: eq(categories.id, values.categoryId), columns: { id: true } });
  if (!category) return { ok: false, error: 'That category no longer exists.' };

  await db.transaction(async (tx) => {
    if (id) await tx.update(catalogItems).set(values).where(eq(catalogItems.id, id));
    else await tx.insert(catalogItems).values(values);
    await logAudit({ actorId: me.id, action: 'catalog.updated', entity: 'catalog_item', entityId: id ?? undefined, details: values }, tx);
  });
  refresh();
  return { ok: true, data: null };
}

// ─── Staff ──────────────────────────────────────────────────────────────────────

const staffSchema = z.object({
  id: z.string().min(1).nullish(),
  name: z.string().trim().min(1, 'Name is required.').max(40),
  role: z.enum(STAFF_ROLES),
  isBarber: z.boolean(),
  commissionBps: bps,
  sortOrder: z.int().min(0).max(999),
  isActive: z.boolean(),
  pin: z.string().regex(PIN_PATTERN, 'PIN must be 4–6 digits.').nullish(),
});

export async function saveStaff(input: z.input<typeof staffSchema>): Promise<ActionResult<null>> {
  const me = await requireOwner();
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const { id, pin, ...values } = parsed.data;

  if (!id) {
    if (!pin) return { ok: false, error: 'Set a PIN for the new staff member.' };
    const pinHash = await hashPin(pin);
    await db.transaction(async (tx) => {
      const [created] = await tx.insert(staff).values({ ...values, pinHash }).returning({ id: staff.id });
      await logAudit({ actorId: me.id, action: 'staff.created', entity: 'staff', entityId: created.id, details: values }, tx);
    });
    refresh();
    return { ok: true, data: null };
  }

  if (id === me.id && !values.isActive) return { ok: false, error: 'You can’t deactivate yourself.' };

  const before = await db.query.staff.findFirst({ where: eq(staff.id, id), columns: { role: true, isActive: true } });
  if (!before) return { ok: false, error: 'Staff member not found.' };

  // Never leave the shop without an active owner — nobody could close days or change settings.
  const wasActiveOwner = before.role === 'owner' && before.isActive;
  const staysActiveOwner = values.role === 'owner' && values.isActive;
  if (wasActiveOwner && !staysActiveOwner) {
    const otherOwner = await db.query.staff.findFirst({
      where: and(eq(staff.role, 'owner'), eq(staff.isActive, true), ne(staff.id, id)),
      columns: { id: true },
    });
    if (!otherOwner) return { ok: false, error: 'This is the only owner. Make someone else an owner first.' };
  }

  await db.transaction(async (tx) => {
    await tx.update(staff).set(values).where(eq(staff.id, id));
    await logAudit({ actorId: me.id, action: 'staff.updated', entity: 'staff', entityId: id, details: values }, tx);
  });
  // Deactivated or demoted: end their sessions so the change applies immediately.
  if ((before.isActive && !values.isActive) || (before.role === 'owner' && values.role !== 'owner')) {
    await revokeAllSessions(id);
  }
  refresh();
  return { ok: true, data: null };
}

export async function resetStaffPin(input: { staffId: string; pin: string }): Promise<ActionResult<null>> {
  const me = await requireOwner();
  const parsed = z
    .object({ staffId: z.string().min(1), pin: z.string().regex(PIN_PATTERN, 'PIN must be 4–6 digits.') })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error);

  const target = await db.query.staff.findFirst({ where: eq(staff.id, parsed.data.staffId), columns: { id: true } });
  if (!target) return { ok: false, error: 'Staff member not found.' };

  const pinHash = await hashPin(parsed.data.pin);
  await db.transaction(async (tx) => {
    await tx
      .update(staff)
      .set({ pinHash, failedPinAttempts: 0, lockedUntil: null })
      .where(eq(staff.id, target.id));
    await logAudit({ actorId: me.id, action: 'staff.pin_reset', entity: 'staff', entityId: target.id }, tx);
  });
  // Sign them out everywhere (except the owner's own current session when resetting their own PIN).
  if (target.id !== me.id) await revokeAllSessions(target.id);
  refresh();
  return { ok: true, data: null };
}
