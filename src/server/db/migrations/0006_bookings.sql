CREATE TABLE `booking_items` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`catalog_item_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`name` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "booking_items_duration_valid" CHECK("booking_items"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE INDEX `booking_items_booking_idx` ON `booking_items` (`booking_id`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`business_date` text NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`barber_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text,
	`notes` text,
	`status` text DEFAULT 'booked' NOT NULL,
	`order_id` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`status_changed_by` text,
	`status_changed_at` integer,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`barber_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`status_changed_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bookings_status_valid" CHECK(status IN ('booked', 'checked_in', 'completed', 'cancelled', 'no_show')),
	CONSTRAINT "bookings_time_valid" CHECK("bookings"."end_at" > "bookings"."start_at")
);
--> statement-breakpoint
CREATE INDEX `bookings_date_idx` ON `bookings` (`business_date`);--> statement-breakpoint
CREATE INDEX `bookings_barber_start_idx` ON `bookings` (`barber_id`,`start_at`);--> statement-breakpoint
CREATE INDEX `bookings_order_idx` ON `bookings` (`order_id`);--> statement-breakpoint
ALTER TABLE `catalog_items` ADD `duration_minutes` integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `working_hours` text;