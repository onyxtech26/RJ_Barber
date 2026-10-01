// Allowed values shared by the database schema, Server Actions and client components.
// Kept free of database imports so client code can use them without pulling in Drizzle.

export const STAFF_ROLES = ['owner', 'staff'] as const;
export const ITEM_KINDS = ['service', 'product'] as const;
export const PAYMENT_METHODS = ['duitnow', 'cash'] as const;
export const ORDER_STATUSES = ['awaiting_payment', 'paid', 'cancelled', 'voided'] as const;
export const DISCOUNT_TYPES = ['percent', 'amount'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type ItemKind = (typeof ITEM_KINDS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  duitnow: 'DuitNow QR',
  cash: 'Cash',
};
