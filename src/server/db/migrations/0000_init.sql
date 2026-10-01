CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`entity` text,
	`entity_id` text,
	`details` text,
	FOREIGN KEY (`actor_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_log_entity_idx` ON `audit_log` (`entity`,`entity_id`);--> statement-breakpoint
CREATE TABLE `catalog_items` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'service' NOT NULL,
	`price_sen` integer NOT NULL,
	`commission_bps` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "catalog_items_kind_valid" CHECK(kind IN ('service', 'product')),
	CONSTRAINT "catalog_items_price_valid" CHECK("catalog_items"."price_sen" >= 0),
	CONSTRAINT "catalog_items_commission_valid" CHECK("catalog_items"."commission_bps" IS NULL OR "catalog_items"."commission_bps" BETWEEN 0 AND 10000)
);
--> statement-breakpoint
CREATE INDEX `catalog_items_category_idx` ON `catalog_items` (`category_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `day_closes` (
	`id` text PRIMARY KEY NOT NULL,
	`business_date` text NOT NULL,
	`closed_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`totals` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`closed_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `day_closes_business_date_unique` ON `day_closes` (`business_date`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`catalog_item_id` text,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`unit_price_sen` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`line_total_sen` integer NOT NULL,
	`barber_id` text,
	`commission_bps` integer DEFAULT 0 NOT NULL,
	`commission_sen` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`barber_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "order_items_kind_valid" CHECK(kind IN ('service', 'product')),
	CONSTRAINT "order_items_amounts_valid" CHECK("order_items"."quantity" > 0 AND "order_items"."unit_price_sen" >= 0 AND "order_items"."line_total_sen" >= 0 AND "order_items"."commission_sen" >= 0),
	CONSTRAINT "order_items_commission_valid" CHECK("order_items"."commission_bps" BETWEEN 0 AND 10000)
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_barber_idx` ON `order_items` (`barber_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_no` text NOT NULL,
	`business_date` text NOT NULL,
	`status` text DEFAULT 'awaiting_payment' NOT NULL,
	`payment_method` text NOT NULL,
	`customer_name` text,
	`customer_phone` text,
	`subtotal_sen` integer NOT NULL,
	`discount_type` text,
	`discount_value` integer,
	`discount_sen` integer DEFAULT 0 NOT NULL,
	`discount_reason` text,
	`discount_approved_by` text,
	`sst_rate_bps` integer DEFAULT 0 NOT NULL,
	`sst_sen` integer DEFAULT 0 NOT NULL,
	`total_sen` integer NOT NULL,
	`cash_received_sen` integer,
	`change_sen` integer,
	`payment_ref` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`confirmed_by` text,
	`confirmed_at` integer,
	`cancelled_by` text,
	`cancelled_at` integer,
	`voided_by` text,
	`voided_at` integer,
	`void_reason` text,
	`day_close_id` text,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`discount_approved_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`confirmed_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cancelled_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`voided_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`day_close_id`) REFERENCES `day_closes`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "orders_status_valid" CHECK(status IN ('awaiting_payment', 'paid', 'cancelled', 'voided')),
	CONSTRAINT "orders_payment_method_valid" CHECK(payment_method IN ('duitnow', 'cash')),
	CONSTRAINT "orders_discount_type_valid" CHECK(discount_type IS NULL OR discount_type IN ('percent', 'amount')),
	CONSTRAINT "orders_amounts_valid" CHECK("orders"."subtotal_sen" >= 0 AND "orders"."discount_sen" >= 0 AND "orders"."discount_sen" <= "orders"."subtotal_sen" AND "orders"."sst_sen" >= 0 AND "orders"."total_sen" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_receipt_no_idx` ON `orders` (`receipt_no`);--> statement-breakpoint
CREATE INDEX `orders_business_date_idx` ON `orders` (`business_date`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `receipt_counters` (
	`business_date` text PRIMARY KEY NOT NULL,
	`last_seq` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shop_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`receipt_footer` text,
	`duitnow_qr_path` text,
	`duitnow_account_name` text,
	`sst_enabled` integer DEFAULT false NOT NULL,
	`sst_rate_bps` integer DEFAULT 800 NOT NULL,
	`sst_reg_no` text,
	`discount_approval_threshold_bps` integer DEFAULT 2000 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "shop_settings_single_row" CHECK("shop_settings"."id" = 1),
	CONSTRAINT "shop_settings_rates_valid" CHECK("shop_settings"."sst_rate_bps" BETWEEN 0 AND 10000 AND "shop_settings"."discount_approval_threshold_bps" BETWEEN 0 AND 10000)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'staff' NOT NULL,
	`pin_hash` text NOT NULL,
	`is_barber` integer DEFAULT true NOT NULL,
	`commission_bps` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`failed_pin_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "staff_role_valid" CHECK(role IN ('owner', 'staff')),
	CONSTRAINT "staff_commission_valid" CHECK(commission_bps BETWEEN 0 AND 10000)
);
