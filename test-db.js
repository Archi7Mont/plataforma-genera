const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    const userCount = await prisma.user.count();
    console.log('✅ Database connection successful!');
    console.log('Users in database:', userCount);

    // Try to find admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@genera.com' }
    });
    console.log('Admin user found:', adminUser ? '✅' : '❌');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();




