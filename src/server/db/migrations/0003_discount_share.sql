-- Hand-edited: drizzle-kit selected the new discount_share_sen column from the old table (it doesn't exist there yet).
-- Existing rows get 0; only development data existed when this ran.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`catalog_item_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`unit_price_sen` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`line_total_sen` integer NOT NULL,
	`discount_share_sen` integer DEFAULT 0 NOT NULL,
	`barber_id` text,
	`commission_bps` integer DEFAULT 0 NOT NULL,
	`commission_sen` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`barber_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "order_items_kind_valid" CHECK(kind IN ('service', 'product')),
	CONSTRAINT "order_items_amounts_valid" CHECK("__new_order_items"."quantity" > 0 AND "__new_order_items"."unit_price_sen" >= 0 AND "__new_order_items"."line_total_sen" >= 0 AND "__new_order_items"."commission_sen" >= 0 AND "__new_order_items"."discount_share_sen" >= 0 AND "__new_order_items"."discount_share_sen" <= "__new_order_items"."line_total_sen"),
	CONSTRAINT "order_items_commission_valid" CHECK("__new_order_items"."commission_bps" BETWEEN 0 AND 10000)
);
--> statement-breakpoint
INSERT INTO `__new_order_items`("id", "order_id", "catalog_item_id", "position", "kind", "name", "unit_price_sen", "quantity", "line_total_sen", "discount_share_sen", "barber_id", "commission_bps", "commission_sen") SELECT "id", "order_id", "catalog_item_id", "position", "kind", "name", "unit_price_sen", "quantity", "line_total_sen", 0, "barber_id", "commission_bps", "commission_sen" FROM `order_items`;--> statement-breakpoint
DROP TABLE `order_items`;--> statement-breakpoint
ALTER TABLE `__new_order_items` RENAME TO `order_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_barber_idx` ON `order_items` (`barber_id`);