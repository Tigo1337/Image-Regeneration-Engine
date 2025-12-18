CREATE TABLE "generated_designs" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" bigint NOT NULL,
	"original_image" text NOT NULL,
	"generated_image" text NOT NULL,
	"original_file_name" text NOT NULL,
	"config" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
