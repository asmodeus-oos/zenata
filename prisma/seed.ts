import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Default Roles
  const roles = [
    { name: 'Owner', description: 'System owner with full global access' },
    { name: 'Admin', description: 'Clinic administrator' },
    { name: 'Doctor', description: 'Clinical practitioner' },
    { name: 'Receptionist', description: 'Front desk and scheduling' },
    { name: 'Accountant', description: 'Financial management' }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log('✅ Basic roles created.');

  // 2. Create Default Permissions
  const permissions = [
    { action: 'patients.create', description: 'Register new patients' },
    { action: 'patients.view', description: 'View patient records' },
    { action: 'patients.edit', description: 'Update patient information' },
    { action: 'appointments.manage', description: 'Create and edit appointments' },
    { action: 'finance.manage', description: 'Full access to ledger' },
    { action: 'inventory.manage', description: 'Manage clinical stock' },
    { action: 'staff.manage', description: 'Manage personnel and RBAC' },
    { action: 'settings.manage', description: 'Global system configuration' }
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      update: {},
      create: perm,
    });
  }

  console.log('✅ System permissions defined.');
  console.log('🌱 Seeding complete. You can now link a user to the Owner role via Dashboard.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
