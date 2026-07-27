const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

(async () => {
  const h = await bcrypt.hash("admin123", 12);
  const t = await p.tenant.upsert({
    where: { slug: "tdp" },
    update: {},
    create: { name: "TDP", slug: "tdp" },
  });

  const users = [
    { email: "superadmin@tdp.com", role: "SUPER_ADMIN", firstName: "Süper", lastName: "Admin" },
    { email: "distributor@tdp.com", role: "DISTRIBUTOR_ADMIN", firstName: "Distribütör", lastName: "Admin" },
    { email: "staff@tdp.com", role: "DISTRIBUTOR_STAFF", firstName: "Distribütör", lastName: "Personel" },
    { email: "dealer@tdp.com", role: "DEALER_ADMIN", firstName: "Bayi", lastName: "Admin" },
    { email: "dealerstaff@tdp.com", role: "DEALER_STAFF", firstName: "Bayi", lastName: "Personel" },
    { email: "subdealer@tdp.com", role: "SUB_DEALER_ADMIN", firstName: "Alt", lastName: "Bayi" },
    { email: "subdealerstaff@tdp.com", role: "SUB_DEALER_STAFF", firstName: "Alt Bayi", lastName: "Personel" },
    { email: "employee@tdp.com", role: "EMPLOYEE", firstName: "Çalışan", lastName: "Kullanıcı" },
    { email: "customer@tdp.com", role: "CUSTOMER", firstName: "Müşteri", lastName: "Kullanıcı" },
  ];

  for (const u of users) {
    const created = await p.user.upsert({
      where: { email: u.email },
      update: { passwordHash: h, role: u.role },
      create: {
        email: u.email,
        passwordHash: h,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        tenantId: t.id,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`✅ ${created.email} — ${created.role}`);
  }

  await p.$disconnect();
  console.log("\nHepsi hazır! Şifre: admin123");
})();
