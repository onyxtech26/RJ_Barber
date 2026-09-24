import { pgTable, uuid, text, integer, boolean, numeric, time, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'client_confirmed', 'in_chair', 'completed', 'cancelled', 'no_show']);
export const bookingSourceEnum = pgEnum('booking_source', ['online', 'walk_in', 'phone', 'whatsapp']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'completed', 'voided', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'qr_code', 'split']);
export const registerSessionStatusEnum = pgEnum('register_session_status', ['open', 'closed']);
export const queueStatusEnum = pgEnum('queue_status', ['waiting', 'called', 'in_chair', 'completed', 'cancelled']);

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  logoUrl: text('logo_url'),
  operatingHours: jsonb('operating_hours'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const barbers = pgTable('barbers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shopId: uuid('shop_id').references(() => shops.id),
  fullName: text('full_name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true),
  commissionRate: numeric('commission_rate', { precision: 4, scale: 2 }).default('0.50'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const services = pgTable('services', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shopId: uuid('shop_id').references(() => shops.id),
  title: text('title').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull(),
  bufferAfterMinutes: integer('buffer_after_minutes').default(5),
  priceCents: integer('price_cents').notNull(),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const barberServices = pgTable('barber_services', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  barberId: uuid('barber_id').references(() => barbers.id),
  serviceId: uuid('service_id').references(() => services.id),
});

export const barberShifts = pgTable('barber_shifts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  barberId: uuid('barber_id').references(() => barbers.id),
  dayOfWeek: integer('day_of_week').notNull(), 
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  breakStart: time('break_start'),
  breakEnd: time('break_end'),
});

export const barberTimeOff = pgTable('barber_time_off', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  barberId: uuid('barber_id').references(() => barbers.id),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  reason: text('reason'),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  authUserId: uuid('auth_user_id'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  notes: text('notes'),
  noShowCount: integer('no_show_count').default(0),
  whatsappOptin: boolean('whatsapp_optin').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shopId: uuid('shop_id').references(() => shops.id),
  barberId: uuid('barber_id').references(() => barbers.id),
  customerId: uuid('customer_id').references(() => customers.id),
  serviceId: uuid('service_id').references(() => services.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: appointmentStatusEnum('status').default('pending'),
  source: bookingSourceEnum('source').default('online'),
  totalPriceCents: integer('total_price_cents').notNull(),
  notes: text('notes'),
  reminder24hSentAt: timestamp('reminder_24h_sent_at'),
  reminder2hSentAt: timestamp('reminder_2h_sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const registerSessions = pgTable('register_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shopId: uuid('shop_id').references(() => shops.id),
  openedBy: text('opened_by').notNull().default('Cashier'),
  openingFloatCents: integer('opening_float_cents').notNull().default(20000), // default $200.00
  closingCashCents: integer('closing_cash_cents'),
  expectedCashCents: integer('expected_cash_cents'),
  cashDifferenceCents: integer('cash_difference_cents'),
  status: registerSessionStatusEnum('status').default('open'),
  notes: text('notes'),
  openedAt: timestamp('opened_at').defaultNow(),
  closedAt: timestamp('closed_at'),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shopId: uuid('shop_id').references(() => shops.id),
  registerSessionId: uuid('register_session_id').references(() => registerSessions.id),
  appointmentId: uuid('appointment_id').references(() => appointments.id),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull().default('Walk-in Client'),
  customerPhone: text('customer_phone'),
  barberId: uuid('barber_id').references(() => barbers.id),
  status: orderStatusEnum('status').default('completed'),
  subtotalCents: integer('subtotal_cents').notNull(),
  discountCents: integer('discount_cents').default(0),
  tipCents: integer('tip_cents').default(0),
  taxCents: integer('tax_cents').default(0),
  totalCents: integer('total_cents').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').default('cash'),
  amountTenderedCents: integer('amount_tendered_cents'),
  changeDueCents: integer('change_due_cents').default(0),
  paymentDetails: jsonb('payment_details'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').references(() => orders.id),
  serviceId: uuid('service_id').references(() => services.id),
  barberId: uuid('barber_id').references(() => barbers.id),
  itemName: text('item_name').notNull(),
  itemType: text('item_type').default('service'), // 'service' | 'product' | 'custom'
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').default(1),
  totalPriceCents: integer('total_price_cents').notNull(),
  commissionCents: integer('commission_cents').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const queueEntries = pgTable('queue_entries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shopId: uuid('shop_id').references(() => shops.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  serviceId: uuid('service_id').references(() => services.id),
  preferredBarberId: uuid('preferred_barber_id').references(() => barbers.id),
  status: queueStatusEnum('status').default('waiting'),
  estimatedWaitMinutes: integer('estimated_wait_minutes').default(15),
  notes: text('notes'),
  joinedAt: timestamp('joined_at').defaultNow(),
  seatedAt: timestamp('seated_at'),
  completedAt: timestamp('completed_at'),
});

// Relations
export const shopsRelations = relations(shops, ({ many }) => ({
  barbers: many(barbers),
  services: many(services),
  appointments: many(appointments),
}));

export const barbersRelations = relations(barbers, ({ one, many }) => ({
  shop: one(shops, {
    fields: [barbers.shopId],
    references: [shops.id],
  }),
  services: many(barberServices),
  shifts: many(barberShifts),
  timeOff: many(barberTimeOff),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  shop: one(shops, {
    fields: [services.shopId],
    references: [shops.id],
  }),
  barbers: many(barberServices),
  appointments: many(appointments),
}));

export const barberServicesRelations = relations(barberServices, ({ one }) => ({
  barber: one(barbers, {
    fields: [barberServices.barberId],
    references: [barbers.id],
  }),
  service: one(services, {
    fields: [barberServices.serviceId],
    references: [services.id],
  }),
}));

export const barberShiftsRelations = relations(barberShifts, ({ one }) => ({
  barber: one(barbers, {
    fields: [barberShifts.barberId],
    references: [barbers.id],
  }),
}));

export const barberTimeOffRelations = relations(barberTimeOff, ({ one }) => ({
  barber: one(barbers, {
    fields: [barberTimeOff.barberId],
    references: [barbers.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  shop: one(shops, {
    fields: [appointments.shopId],
    references: [shops.id],
  }),
  barber: one(barbers, {
    fields: [appointments.barberId],
    references: [barbers.id],
  }),
  customer: one(customers, {
    fields: [appointments.customerId],
    references: [customers.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
}));

export const registerSessionsRelations = relations(registerSessions, ({ one, many }) => ({
  shop: one(shops, {
    fields: [registerSessions.shopId],
    references: [shops.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  shop: one(shops, {
    fields: [orders.shopId],
    references: [shops.id],
  }),
  session: one(registerSessions, {
    fields: [orders.registerSessionId],
    references: [registerSessions.id],
  }),
  barber: one(barbers, {
    fields: [orders.barberId],
    references: [barbers.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  appointment: one(appointments, {
    fields: [orders.appointmentId],
    references: [appointments.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  service: one(services, {
    fields: [orderItems.serviceId],
    references: [services.id],
  }),
  barber: one(barbers, {
    fields: [orderItems.barberId],
    references: [barbers.id],
  }),
}));

export const queueEntriesRelations = relations(queueEntries, ({ one }) => ({
  shop: one(shops, {
    fields: [queueEntries.shopId],
    references: [shops.id],
  }),
  service: one(services, {
    fields: [queueEntries.serviceId],
    references: [services.id],
  }),
  preferredBarber: one(barbers, {
    fields: [queueEntries.preferredBarberId],
    references: [barbers.id],
  }),
}));

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;

export type Barber = typeof barbers.$inferSelect;
export type NewBarber = typeof barbers.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type BarberService = typeof barberServices.$inferSelect;
export type NewBarberService = typeof barberServices.$inferInsert;

export type BarberShift = typeof barberShifts.$inferSelect;
export type NewBarberShift = typeof barberShifts.$inferInsert;

export type BarberTimeOff = typeof barberTimeOff.$inferSelect;
export type NewBarberTimeOff = typeof barberTimeOff.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type RegisterSession = typeof registerSessions.$inferSelect;
export type NewRegisterSession = typeof registerSessions.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type QueueEntry = typeof queueEntries.$inferSelect;
export type NewQueueEntry = typeof queueEntries.$inferInsert;
