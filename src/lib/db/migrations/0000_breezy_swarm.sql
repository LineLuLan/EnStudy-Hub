CREATE TYPE "public"."card_state" AS ENUM('new', 'learning', 'review', 'relearning');--> statement-breakpoint
CREATE TYPE "public"."cefr" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."review_type" AS ENUM('flashcard', 'mcq', 'typing', 'listening');--> statement-breakpoint
-- NOTE: auth.users is managed by Supabase Auth — do NOT create it.
-- Foreign-key references below still resolve to the existing auth.users table.
-- (Drizzle generated a CREATE TABLE block here; it was removed manually.)
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"word" text NOT NULL,
	"lemma" text,
	"ipa" text,
	"pos" text,
	"cefr_level" "cefr",
	"definitions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"synonyms" text[],
	"antonyms" text[],
	"collocations" text[],
	"etymology_hint" text,
	"mnemonic_vi" text,
	"audio_url" text,
	"image_url" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_image" text,
	"language_from" text DEFAULT 'en' NOT NULL,
	"language_to" text DEFAULT 'vi' NOT NULL,
	"level_min" "cefr",
	"level_max" "cefr",
	"is_official" boolean DEFAULT false NOT NULL,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"card_count" integer DEFAULT 0 NOT NULL,
	"estimated_minutes" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"avatar" text,
	"timezone" text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"locale" text DEFAULT 'vi' NOT NULL,
	"daily_new_cards" integer DEFAULT 20 NOT NULL,
	"daily_review_max" integer DEFAULT 200 NOT NULL,
	"ui_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_card_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration_ms" integer,
	"state_before" jsonb,
	"state_after" jsonb,
	"review_type" "review_type" DEFAULT 'flashcard' NOT NULL,
	"client_review_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"cards_reviewed" integer DEFAULT 0 NOT NULL,
	"accuracy_pct" real,
	"new_cards_learned" integer DEFAULT 0 NOT NULL,
	"xp_gained" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"icon" text,
	"color" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"stability" real DEFAULT 0 NOT NULL,
	"difficulty" real DEFAULT 0 NOT NULL,
	"elapsed_days" integer DEFAULT 0 NOT NULL,
	"scheduled_days" integer DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"state" "card_state" DEFAULT 'new' NOT NULL,
	"last_review" timestamp with time zone,
	"due" timestamp with time zone DEFAULT now() NOT NULL,
	"suspended" boolean DEFAULT false NOT NULL,
	"fsrs_version" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_lessons" (
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "user_lessons_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_stats" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"total_cards_mature" integer DEFAULT 0 NOT NULL,
	"last_active_date" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cards" ADD CONSTRAINT "cards_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_user_card_id_user_cards_id_fk" FOREIGN KEY ("user_card_id") REFERENCES "public"."user_cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topics" ADD CONSTRAINT "topics_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_lessons" ADD CONSTRAINT "user_lessons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_lessons" ADD CONSTRAINT "user_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "card_lesson_idx" ON "cards" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_topic_slug" ON "lessons" USING btree ("topic_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "review_log_client_unq" ON "review_logs" USING btree ("user_id","client_review_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_log_user_time" ON "review_logs" USING btree ("user_id","reviewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "topic_collection_slug" ON "topics" USING btree ("collection_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_card_unq" ON "user_cards" USING btree ("user_id","card_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_card_due_idx" ON "user_cards" USING btree ("user_id","due");