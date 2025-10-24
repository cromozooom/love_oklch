import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function runSeedFile(filename: string): Promise<void> {
  const seedPath = join(__dirname, 'seeds', filename);
  const seedSql = readFileSync(seedPath, 'utf-8');
  
  console.log(`Running seed file: ${filename}`);
  
  try {
    // Execute the SQL directly using Prisma's raw query capability
    await prisma.$executeRawUnsafe(seedSql);
    console.log(`✓ Successfully executed ${filename}`);
  } catch (error) {
    console.error(`✗ Failed to execute ${filename}:`, error);
    throw error;
  }
}

async function main(): Promise<void> {
  console.log('Starting database seeding...');
  
  try {
    // List of seed files to run in order
    const seedFiles = [
      '01-initial-data.sql'
    ];
    
    // Run each seed file
    for (const file of seedFiles) {
      await runSeedFile(file);
    }
    
    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nSeeded data includes:');
    console.log('- 3 subscription plans (Free, Basic, Pro)');
    console.log('- 7 features with different configurations');
    console.log('- 4 test users with different roles');
    console.log('- 3 active subscriptions');
    console.log('- 1 admin role assignment');
    
  } catch (error) {
    console.error('\n✗ Database seeding failed:', error);
    process.exit(1);
  }
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