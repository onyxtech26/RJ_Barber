import { relations, sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { DISCOUNT_TYPES, ITEM_KINDS, ORDER_STATUSES, PAYMENT_METHODS, STAFF_ROLES } from '../../lib/enums';

export * from '../../lib/enums';

/*
 * Conventions
 * - Money is integer sen (RM 45.00 = 4500). Never floats.
 * - Rates are integer basis points (bps): 5000 = 50%, 800 = 8%.
 * - Timestamps are stored as epoch milliseconds.
 * - business_date is the shop's local day (Asia/Kuala_Lumpur) as 'YYYY-MM-DD'.
 */

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);

// SQLite doesn't enforce Drizzle enums (they're TypeScript-only), so add a real CHECK constraint.
const inList = (column: string, values: readonly string[]) =>
  sql.raw(`${column} IN (${values.map((v) => `'${v}'`).join(', ')})`);

const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`)
    .$onUpdateFn(() => new Date());


// Single row (id = 1): everything printed on receipts and shop-wide rules.
export const shopSettings = sqliteTable('shop_settings', {
  id: integer('id').primaryKey().default(1),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  receiptFooter: text('receipt_footer'),
  duitnowQrPath: text('duitnow_qr_path'),
  duitnowAccountName: text('duitnow_account_name'),
  sstEnabled: integer('sst_enabled', { mode: 'boolean' }).notNull().default(false),
  sstRateBps: integer('sst_rate_bps').notNull().default(800),
  sstRegNo: text('sst_reg_no'),
  // Discounts above this need an owner PIN at the counter.
  discountApprovalThresholdBps: integer('discount_approval_threshold_bps').notNull().default(2000),
  updatedAt: updatedAt(),
}, (t) => [
  check('shop_settings_single_row', sql`${t.id} = 1`),
  check('shop_settings_rates_valid', sql`${t.sstRateBps} BETWEEN 0 AND 10000 AND ${t.discountApprovalThresholdBps} BETWEEN 0 AND 10000`),
]);

// Everyone who signs in to the POS. Barbers are staff with is_barber = true.
export const staff = sqliteTable('staff', {
  id: id(),
  name: text('name').notNull(),
  role: text('role', { enum: STAFF_ROLES }).notNull().default('staff'),
  pinHash: text('pin_hash').notNull(),
  isBarber: integer('is_barber', { mode: 'boolean' }).notNull().default(true),
  commissionBps: integer('commission_bps').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  failedPinAttempts: integer('failed_pin_attempts').notNull().default(0),
  lockedUntil: integer('locked_until', { mode: 'timestamp_ms' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, () => [
  check('staff_role_valid', inList('role', STAFF_ROLES)),
  check('staff_commission_valid', sql`commission_bps BETWEEN 0 AND 10000`),
]);

// Signed-in sessions. The cookie holds a random token; only its SHA-256 hash is stored here,
// so a copied database file can't be used to impersonate anyone.
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(), // sha256(token) hex
    staffId: text('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [index('sessions_staff_idx').on(t.staffId)]
);

export const categories = sqliteTable('categories', {
  id: id(),
  name: text('name').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

// Services and retail products share one catalog.
export const catalogItems = sqliteTable(
  'catalog_items',
  {
    id: id(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    name: text('name').notNull(),
    kind: text('kind', { enum: ITEM_KINDS }).notNull().default('service'),
    priceSen: integer('price_sen').notNull(),
    // null = use the barber's rate (services) or 0% (products).
    commissionBps: integer('commission_bps'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('catalog_items_category_idx').on(t.categoryId),
    check('catalog_items_kind_valid', inList('kind', ITEM_KINDS)),
    check('catalog_items_price_valid', sql`${t.priceSen} >= 0`),
    check('catalog_items_commission_valid', sql`${t.commissionBps} IS NULL OR ${t.commissionBps} BETWEEN 0 AND 10000`),
  ]
);

export const dayCloses = sqliteTable('day_closes', {
  id: id(),
  businessDate: text('business_date').notNull().unique(),
  closedBy: text('closed_by')
    .notNull()
    .references(() => staff.id),
  closedAt: createdAt(),
  // Frozen copy of the totals at the moment of closing.
  totals: text('totals', { mode: 'json' }).notNull(),
  notes: text('notes'),
});

export const orders = sqliteTable(
  'orders',
  {
    // Generated by the terminal before submitting, so a retried request can't create a duplicate.
    id: text('id').primaryKey(),
    receiptNo: text('receipt_no').notNull(),
    businessDate: text('business_date').notNull(),
    status: text('status', { enum: ORDER_STATUSES }).notNull().default('awaiting_payment'),
    paymentMethod: text('payment_method', { enum: PAYMENT_METHODS }).notNull(),

    customerName: text('customer_name'),
    customerPhone: text('customer_phone'),

    subtotalSen: integer('subtotal_sen').notNull(),
    discountType: text('discount_type', { enum: DISCOUNT_TYPES }),
    discountValue: integer('discount_value'), // bps for percent, sen for amount
    discountSen: integer('discount_sen').notNull().default(0),
    discountReason: text('discount_reason'),
    discountApprovedBy: text('discount_approved_by').references(() => staff.id),
    sstRateBps: integer('sst_rate_bps').notNull().default(0),
    sstSen: integer('sst_sen').notNull().default(0),
    totalSen: integer('total_sen').notNull(),

    cashReceivedSen: integer('cash_received_sen'),
    changeSen: integer('change_sen'),
    paymentRef: text('payment_ref'),

    createdBy: text('created_by')
      .notNull()
      .references(() => staff.id),
    createdAt: createdAt(),
    confirmedBy: text('confirmed_by').references(() => staff.id),
    confirmedAt: integer('confirmed_at', { mode: 'timestamp_ms' }),
    cancelledBy: text('cancelled_by').references(() => staff.id),
    cancelledAt: integer('cancelled_at', { mode: 'timestamp_ms' }),
    voidedBy: text('voided_by').references(() => staff.id),
    voidedAt: integer('voided_at', { mode: 'timestamp_ms' }),
    voidReason: text('void_reason'),

    dayCloseId: text('day_close_id').references(() => dayCloses.id),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('orders_receipt_no_idx').on(t.receiptNo),
    index('orders_business_date_idx').on(t.businessDate),
    index('orders_status_idx').on(t.status),
    check('orders_status_valid', inList('status', ORDER_STATUSES)),
    check('orders_payment_method_valid', inList('payment_method', PAYMENT_METHODS)),
    check('orders_discount_type_valid', sql`discount_type IS NULL OR ${inList('discount_type', DISCOUNT_TYPES)}`),
    check(
      'orders_amounts_valid',
      sql`${t.subtotalSen} >= 0 AND ${t.discountSen} >= 0 AND ${t.discountSen} <= ${t.subtotalSen} AND ${t.sstSen} >= 0 AND ${t.totalSen} >= 0`
    ),
  ]
);

// Every line copies name, price and commission at the time of sale,
// so later catalog or rate changes never rewrite history.
export const orderItems = sqliteTable(
  'order_items',
  {
    id: id(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    catalogItemId: text('catalog_item_id').references(() => catalogItems.id, { onDelete: 'set null' }),
    position: integer('position').notNull().default(0), // line order on the receipt
    kind: text('kind', { enum: ITEM_KINDS }).notNull(),
    name: text('name').notNull(),
    unitPriceSen: integer('unit_price_sen').notNull(),
    quantity: integer('quantity').notNull().default(1),
    lineTotalSen: integer('line_total_sen').notNull(),
    // This line's share of the ticket discount, so per-barber sales can be reported net of discounts.
    discountShareSen: integer('discount_share_sen').notNull().default(0),
    barberId: text('barber_id').references(() => staff.id),
    commissionBps: integer('commission_bps').notNull().default(0),
    commissionSen: integer('commission_sen').notNull().default(0),
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    index('order_items_barber_idx').on(t.barberId),
    check('order_items_kind_valid', inList('kind', ITEM_KINDS)),
    check('order_items_amounts_valid', sql`${t.quantity} > 0 AND ${t.unitPriceSen} >= 0 AND ${t.lineTotalSen} >= 0 AND ${t.commissionSen} >= 0 AND ${t.discountShareSen} >= 0 AND ${t.discountShareSen} <= ${t.lineTotalSen}`),
    check('order_items_commission_valid', sql`${t.commissionBps} BETWEEN 0 AND 10000`),
  ]
);

// Gap-free-per-day receipt numbering: RJ-20261001-001.
export const receiptCounters = sqliteTable('receipt_counters', {
  businessDate: text('business_date').primaryKey(),
  lastSeq: integer('last_seq').notNull().default(0),
});

// Who did what: confirmations, cancels, voids, discounts, settings changes, logins.
export const auditLog = sqliteTable(
  'audit_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    at: createdAt(),
    actorId: text('actor_id').references(() => staff.id),
    action: text('action').notNull(),
    entity: text('entity'),
    entityId: text('entity_id'),
    details: text('details', { mode: 'json' }),
  },
  (t) => [index('audit_log_entity_idx').on(t.entity, t.entityId)]
);

// Relations (for db.query.* with nested data)
export const staffRelations = relations(staff, ({ many }) => ({
  orderItems: many(orderItems),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  staff: one(staff, { fields: [sessions.staffId], references: [staff.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(catalogItems),
}));

export const catalogItemsRelations = relations(catalogItems, ({ one }) => ({
  category: one(categories, { fields: [catalogItems.categoryId], references: [categories.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  createdByStaff: one(staff, { fields: [orders.createdBy], references: [staff.id], relationName: 'createdBy' }),
  confirmedByStaff: one(staff, { fields: [orders.confirmedBy], references: [staff.id], relationName: 'confirmedBy' }),
  voidedByStaff: one(staff, { fields: [orders.voidedBy], references: [staff.id], relationName: 'voidedBy' }),
  dayClose: one(dayCloses, { fields: [orders.dayCloseId], references: [dayCloses.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  barber: one(staff, { fields: [orderItems.barberId], references: [staff.id] }),
  catalogItem: one(catalogItems, { fields: [orderItems.catalogItemId], references: [catalogItems.id] }),
}));

export const dayClosesRelations = relations(dayCloses, ({ one, many }) => ({
  closedByStaff: one(staff, { fields: [dayCloses.closedBy], references: [staff.id] }),
  orders: many(orders),
}));

export type ShopSettings = typeof shopSettings.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type NewCatalogItem = typeof catalogItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type DayClose = typeof dayCloses.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;

