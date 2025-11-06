import {
  PrismaClient,
  SubscriptionStatus,
  PaymentType,
  AdminRoleType,
} from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

/**
 * Reset database by clearing all tables in dependency order
 * Use this for E2E tests to ensure clean state
 */
async function resetDatabase(): Promise<void> {
  console.log('🧹 Resetting database...\n');

  // Delete all records in reverse order of dependencies
  await prisma.projectModification.deleteMany({});
  console.log('  ✓ Cleared project modifications');

  await prisma.project.deleteMany({});
  console.log('  ✓ Cleared projects');

  await prisma.adminRole.deleteMany({});
  console.log('  ✓ Cleared admin roles');

  await prisma.subscription.deleteMany({});
  console.log('  ✓ Cleared subscriptions');

  await prisma.user.deleteMany({});
  console.log('  ✓ Cleared users');

  await prisma.planFeature.deleteMany({});
  console.log('  ✓ Cleared plan features');

  await prisma.feature.deleteMany({});
  console.log('  ✓ Cleared features');

  await prisma.plan.deleteMany({});
  console.log('  ✓ Cleared plans\n');
}

interface SeedData {
  plans: Array<{
    plan_id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: string;
    billing_interval: string | null;
    is_active: boolean;
    sort_order: number;
    metadata: Record<string, any>;
  }>;
  features: Array<{
    feature_id: string;
    key_name: string;
    display_name: string;
    description: string;
    category: string;
    is_boolean: boolean;
    default_value: Record<string, any>;
    validation_schema: Record<string, any>;
    is_active: boolean;
  }>;
  plan_features: Array<{
    plan_id: string;
    feature_id: string;
    value: Record<string, any>;
    is_enabled: boolean;
    description?: string;
  }>;
  users: Array<{
    user_id: string;
    email: string;
    password_hash: string;
    name: string;
    is_active: boolean;
    description?: string;
  }>;
  subscriptions: Array<{
    user_id: string;
    plan_id: string;
    status: string;
    payment_type: string;
    description?: string;
  }>;
  admin_roles: Array<{
    user_id: string;
    role_name: string;
    permissions: Record<string, any>;
    granted_by: string | null;
    description?: string;
  }>;
}

async function seedFromJson(): Promise<void> {
  const seedPath = join(
    __dirname,
    '..',
    '..',
    'database',
    'seeds',
    'seed-data.json',
  );
  const seedData: SeedData = JSON.parse(readFileSync(seedPath, 'utf-8'));

  console.log('🌱 Starting database seeding from JSON...\n');

  try {
    // 1. Seed Plans
    console.log('📋 Seeding plans...');
    for (const plan of seedData.plans) {
      await prisma.plan.create({
        data: {
          planId: plan.plan_id,
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          price: plan.price,
          currency: plan.currency,
          billingInterval: plan.billing_interval,
          isActive: plan.is_active,
          sortOrder: plan.sort_order,
          metadata: plan.metadata,
        },
      });
      console.log(`  ✓ Created plan: ${plan.name}`);
    }

    // 2. Seed Features
    console.log('\n🚀 Seeding features...');
    for (const feature of seedData.features) {
      await prisma.feature.create({
        data: {
          featureId: feature.feature_id,
          keyName: feature.key_name,
          displayName: feature.display_name,
          description: feature.description,
          category: feature.category,
          isBoolean: feature.is_boolean,
          defaultValue: feature.default_value,
          validationSchema: feature.validation_schema,
          isActive: feature.is_active,
        },
      });
      console.log(`  ✓ Created feature: ${feature.display_name}`);
    }

    // 3. Seed Plan Features (the entitlement matrix)
    console.log('\n🔗 Seeding plan-feature relationships...');
    for (const planFeature of seedData.plan_features) {
      await prisma.planFeature.create({
        data: {
          planId: planFeature.plan_id,
          featureId: planFeature.feature_id,
          value: planFeature.value,
          isEnabled: planFeature.is_enabled,
        },
      });
      console.log(
        `  ✓ ${planFeature.description || 'Created plan-feature relationship'}`,
      );
    }

    // 4. Seed Users
    console.log('\n👥 Seeding users...');
    for (const user of seedData.users) {
      await prisma.user.create({
        data: {
          userId: user.user_id,
          email: user.email,
          passwordHash: user.password_hash,
          name: user.name,
          isActive: user.is_active,
        },
      });
      console.log(
        `  ✓ Created user: ${user.email} (${user.description || user.name})`,
      );
    }

    // 5. Seed Subscriptions
    console.log('\n💳 Seeding subscriptions...');
    for (const subscription of seedData.subscriptions) {
      const startDate = new Date();
      const endDate =
        subscription.payment_type === 'recurring'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          : null;
      const gracePeriodEnd =
        subscription.payment_type === 'recurring'
          ? new Date(Date.now() + 37 * 24 * 60 * 60 * 1000) // 7 days after end_date
          : null;

      await prisma.subscription.create({
        data: {
          userId: subscription.user_id,
          planId: subscription.plan_id,
          status: subscription.status as SubscriptionStatus,
          paymentType: subscription.payment_type as PaymentType,
          startDate: startDate,
          endDate: endDate,
          gracePeriodEnd: gracePeriodEnd,
        },
      });
      console.log(`  ✓ ${subscription.description || 'Created subscription'}`);
    }

    // 6. Seed Admin Roles
    console.log('\n🛡️ Seeding admin roles...');
    for (const adminRole of seedData.admin_roles) {
      await prisma.adminRole.create({
        data: {
          userId: adminRole.user_id,
          roleName: adminRole.role_name as AdminRoleType,
          permissions: adminRole.permissions,
          grantedBy: adminRole.granted_by,
        },
      });
      console.log(
        `  ✓ ${adminRole.description || `Created admin role: ${adminRole.role_name}`}`,
      );
    }

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${seedData.plans.length} subscription plans`);
    console.log(`   • ${seedData.features.length} features`);
    console.log(
      `   • ${seedData.plan_features.length} plan-feature relationships`,
    );
    console.log(`   • ${seedData.users.length} users`);
    console.log(`   • ${seedData.subscriptions.length} subscriptions`);
    console.log(`   • ${seedData.admin_roles.length} admin roles`);

    console.log('\n🔑 Your test accounts:');
    console.log(
      '   • default@solopx.com (password: password123) - Pro plan with all features',
    );
    console.log(
      '   • subscription@solopx.com (password: password123) - Pro plan with all features',
    );
    console.log('   • admin@solopx.com (password: password123) - Admin access');
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  // Check if we should reset database (for E2E tests)
  const shouldReset =
    process.argv.includes('--reset') || process.env.RESET_DB === 'true';

  if (shouldReset) {
    await resetDatabase();
  }

  await seedFromJson();
}

// Run the seeding process
main()
  .catch((error) => {
    console.error('Unexpected error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export default main;
