import { pgTable, uuid, text, integer, boolean, numeric, time, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'client_confirmed', 'in_chair', 'completed', 'cancelled', 'no_show']);
export const bookingSourceEnum = pgEnum('booking_source', ['online', 'walk_in', 'phone', 'whatsapp']);

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
