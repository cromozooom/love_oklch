-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'expired', 'canceled', 'pending', 'grace_period');

-- CreateEnum
CREATE TYPE "payment_type" AS ENUM ('recurring', 'one_time');

-- CreateEnum
CREATE TYPE "admin_role_type" AS ENUM ('super_admin', 'plan_manager', 'billing_admin', 'support_admin');

-- CreateEnum
CREATE TYPE "color_gamut" AS ENUM ('sRGB', 'Display P3', 'Unlimited gamut');

-- CreateEnum
CREATE TYPE "color_space" AS ENUM ('LCH', 'OKLCH');

-- CreateEnum
CREATE TYPE "modification_type" AS ENUM ('property_change', 'initial_state');

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "projects" (
    "project_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color_gamut" "color_gamut" NOT NULL,
    "color_space" "color_space" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "project_modifications" (
    "modification_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "type" "modification_type" NOT NULL,
    "property_name" VARCHAR(50) NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "command_id" UUID NOT NULL,

    CONSTRAINT "project_modifications_pkey" PRIMARY KEY ("modification_id")
);

-- CreateTable
CREATE TABLE "plans" (
    "plan_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "billing_interval" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "features" (
    "feature_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key_name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "is_boolean" BOOLEAN NOT NULL DEFAULT false,
    "default_value" JSONB NOT NULL DEFAULT '{}',
    "validation_schema" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_pkey" PRIMARY KEY ("feature_id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "subscription_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'pending',
    "payment_type" "payment_type" NOT NULL DEFAULT 'recurring',
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6),
    "grace_period_end" TIMESTAMPTZ(6),
    "trial_end_date" TIMESTAMPTZ(6),
    "billing_cycle_anchor" TIMESTAMPTZ(6),
    "external_subscription_id" VARCHAR(255),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "plan_feature_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "plan_id" UUID NOT NULL,
    "feature_id" UUID NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("plan_feature_id")
);

-- CreateTable
CREATE TABLE "admin_roles" (
    "role_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "role_name" "admin_role_type" NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "granted_by" UUID,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "feature_usage" (
    "usage_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "feature_id" UUID NOT NULL,
    "subscription_id" UUID,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "usage_data" JSONB NOT NULL DEFAULT '{}',
    "period_start" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_end" TIMESTAMPTZ(6),
    "last_reset_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_usage_pkey" PRIMARY KEY ("usage_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_projects_user_active" ON "projects"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_projects_updated_at" ON "projects"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "unique_project_name_per_user" ON "projects"("user_id", "name");

-- CreateIndex
CREATE INDEX "idx_project_modifications_project_timestamp" ON "project_modifications"("project_id", "timestamp");

-- CreateIndex
CREATE INDEX "idx_project_modifications_command" ON "project_modifications"("command_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "features_key_name_key" ON "features"("key_name");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user_status" ON "subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_subscriptions_status_dates" ON "subscriptions"("status", "end_date", "grace_period_end");

-- CreateIndex
CREATE INDEX "idx_plan_features_plan_id" ON "plan_features"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_plan_id_feature_id_key" ON "plan_features"("plan_id", "feature_id");

-- CreateIndex
CREATE INDEX "idx_admin_roles_user_active" ON "admin_roles"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_feature_usage_user_feature" ON "feature_usage"("user_id", "feature_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_modifications" ADD CONSTRAINT "project_modifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("feature_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("feature_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("subscription_id") ON DELETE SET NULL ON UPDATE CASCADE;
