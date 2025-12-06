// Prisma Client Singleton Configuration
// This prevents multiple Prisma Client instances during development HMR (Hot Module Replacement)
// Learn more: https://pris.ly/d/help/next-js-best-practices

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Extend global type to include prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create singleton instance
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

// In development, store the instance on globalThis to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown - disconnect Prisma Client on process exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;