ALTER TABLE "announcements" ADD COLUMN "blocked_from" timestamp;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "blocked_until" timestamp;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "open_hour" text DEFAULT '07:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "close_hour" text DEFAULT '18:00' NOT NULL;