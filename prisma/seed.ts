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

  const roleMap: Record<string, string> = {};

  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    roleMap[role.name] = createdRole.id;
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

  // 3. Provision the Initial Owner User
  const ownerAuthId = "a6893db7-6a74-4392-9feb-e1845e2465d7";
  const ownerEmail = "owner@zendenta.com";

  console.log(`👤 Provisioning owner: ${ownerEmail}...`);

  const user = await prisma.user.upsert({
    where: { authId: ownerAuthId },
    update: {
      email: ownerEmail,
      isActive: true,
    },
    create: {
      authId: ownerAuthId,
      email: ownerEmail,
      name: 'System Owner',
      username: 'owner',
      isActive: true,
    },
  });

  // Link to Owner role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: roleMap['Owner'],
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: roleMap['Owner'],
    }
  });

  console.log('✅ Owner account provisioned and linked to role.');
  console.log('🌱 Seeding complete. You can now log in.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
