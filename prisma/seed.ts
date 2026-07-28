import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "../src/lib/auth/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Tenant ──
  const tenant = await prisma.tenant.upsert({
    where: { slug: "tdp-main" },
    update: {},
    create: {
      name: "TDP Ana İşletme",
      slug: "tdp-main",
      domain: "tdp.com.tr",
      isActive: true,
    },
  });
  console.log(`  ✓ Tenant: ${tenant.name}`);

  // ── Seed Permissions ──
  console.log("  ⏳ Seeding permissions...");
  const permissionCodes = Object.keys(ALL_PERMISSIONS) as Array<keyof typeof ALL_PERMISSIONS>;
  const groupMap: Record<string, string> = {};

  for (const code of permissionCodes) {
    const group = code.split(".")[0] ?? "Other";
    const description = ALL_PERMISSIONS[code as keyof typeof ALL_PERMISSIONS];
    await prisma.permission.upsert({
      where: { code },
      update: { description, group },
      create: { code, description, group },
    });
    groupMap[code] = group;
  }
  console.log(`  ✓ ${permissionCodes.length} permissions seeded`);

  // ── Seed Default Role Permissions ──
  console.log("  ⏳ Seeding default role permissions...");
  const allPermissions = await prisma.permission.findMany();
  let roleCount = 0;

  for (const [role, codes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const code of codes) {
      const perm = allPermissions.find((p) => p.code === code);
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: { role: role as any, permissionId: perm.id },
          },
          update: {},
          create: { role: role as any, permissionId: perm.id },
        });
        roleCount++;
      }
    }
  }
  console.log(`  ✓ ${roleCount} default role permissions seeded`);

  // ── Distributor ──
  const distributor = await prisma.distributor.upsert({
    where: { code: "DIST-001" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Ana Distribütör",
      code: "DIST-001",
      email: "distributor@tdp.com.tr",
      isActive: true,
    },
  });
  console.log(`  ✓ Distributor: ${distributor.name}`);

  // ── Dealer ──
  const dealer = await prisma.dealer.upsert({
    where: { code: "DEALER-001" },
    update: {},
    create: {
      distributorId: distributor.id,
      tenantId: tenant.id,
      name: "Örnek Bayi",
      code: "DEALER-001",
      email: "dealer@tdp.com.tr",
      isActive: true,
    },
  });
  console.log(`  ✓ Dealer: ${dealer.name}`);

  // ── Admin User (SUPER_ADMIN) ──
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@tdp.com.tr" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@tdp.com.tr",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "Kullanıcı",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log(`  ✓ Admin: ${admin.email} / şifre: admin123`);

  // ── Dealer Admin User ──
  const dealerPassword = await bcrypt.hash("dealer123", 12);
  const dealerUser = await prisma.user.upsert({
    where: { email: "dealer@tdp.com.tr" },
    update: {},
    create: {
      tenantId: tenant.id,
      distributorId: distributor.id,
      dealerId: dealer.id,
      email: "dealer@tdp.com.tr",
      passwordHash: dealerPassword,
      firstName: "Bayi",
      lastName: "Kullanıcı",
      role: "DEALER_ADMIN",
      isActive: true,
    },
  });
  console.log(`  ✓ Dealer User: ${dealerUser.email} / şifre: dealer123`);

  // ── Sample Customers ──
  const customer1 = await prisma.customer.upsert({
    where: { email: "musteri1@tdp.com.tr" },
    update: {},
    create: {
      tenantId: tenant.id,
      distributorId: distributor.id,
      email: "musteri1@tdp.com.tr",
      firstName: "Ahmet",
      lastName: "Yılmaz",
      phone: "+905551110011",
      countryCode: "TR",
      isActive: true,
    },
  });
  console.log(`  ✓ Customer: ${customer1.email}`);

  const customer2 = await prisma.customer.upsert({
    where: { email: "musteri2@tdp.com.tr" },
    update: {},
    create: {
      tenantId: tenant.id,
      dealerId: dealer.id,
      email: "musteri2@tdp.com.tr",
      firstName: "Ayşe",
      lastName: "Demir",
      phone: "+905552220022",
      countryCode: "TR",
      isActive: true,
    },
  });
  console.log(`  ✓ Customer: ${customer2.email}`);

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
