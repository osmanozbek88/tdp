import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
