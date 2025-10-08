import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      dbTenantId: 'admin-tenant',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample scripts
  await prisma.script.create({
    data: {
      name: 'Get User List',
      description: 'Fetches all users from the platform',
      code: `async function execute(bearerToken, params) {
  const response = await fetch('https://api.example.com/users', {
    headers: {
      'Authorization': \`Bearer \${bearerToken}\`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}`,
      category: 'Users',
      createdBy: admin.id,
    },
  });

  console.log('✅ Created sample scripts');
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });