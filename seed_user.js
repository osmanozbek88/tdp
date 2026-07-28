const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

const ALL_PERMISSIONS = {
  // Orders
  "Orders.Create": "Sipariş oluşturma",
  "Orders.View": "Sipariş görüntüleme",
  "Orders.Edit": "Sipariş düzenleme",
  "Orders.Delete": "Sipariş silme",
  "Orders.Approve": "Sipariş onaylama",
  "Orders.Refund": "İade işlemi",
  // Products
  "Products.Create": "Ürün oluşturma",
  "Products.View": "Ürün görüntüleme",
  "Products.Edit": "Ürün düzenleme",
  "Products.Delete": "Ürün silme",
  // eSIM
  "ESim.View": "eSIM görüntüleme",
  "ESim.Activate": "eSIM aktifleştirme",
  "ESim.Suspend": "eSIM askıya alma",
  "ESim.Reactivate": "eSIM yeniden aktifleştirme",
  "ESim.Terminate": "eSIM sonlandırma",
  // Users
  "Users.Create": "Kullanıcı oluşturma",
  "Users.View": "Kullanıcı görüntüleme",
  "Users.Edit": "Kullanıcı düzenleme",
  "Users.Delete": "Kullanıcı silme",
  // Dealers
  "Dealers.Create": "Bayi oluşturma",
  "Dealers.View": "Bayi görüntüleme",
  "Dealers.Edit": "Bayi düzenleme",
  "Dealers.Delete": "Bayi silme",
  // Tenants
  "Tenants.Create": "Tenant oluşturma",
  "Tenants.View": "Tenant görüntüleme",
  "Tenants.Edit": "Tenant düzenleme",
  "Tenants.Delete": "Tenant silme",
  // Reports
  "Reports.View": "Rapor görüntüleme",
  "Reports.Export": "Rapor dışa aktarma",
  // Admin
  "Admin.Access": "Admin paneline erişim",
  "Admin.ManageRoles": "Rol ve yetki yönetimi",
  // Webhooks
  "Webhooks.View": "Webhook görüntüleme",
  "Webhooks.Process": "Webhook işleme",
};

const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.keys(ALL_PERMISSIONS),
  DISTRIBUTOR_ADMIN: [
    "Orders.Create", "Orders.View", "Orders.Edit", "Orders.Approve",
    "Products.View",
    "ESim.View", "ESim.Activate",
    "Users.Create", "Users.View", "Users.Edit",
    "Dealers.Create", "Dealers.View", "Dealers.Edit",
    "Reports.View", "Reports.Export",
    "Webhooks.View",
  ],
  DISTRIBUTOR_STAFF: [
    "Orders.Create", "Orders.View",
    "Products.View",
    "ESim.View", "ESim.Activate",
    "Users.View",
    "Dealers.View",
    "Reports.View",
    "Webhooks.View",
  ],
  DEALER_ADMIN: [
    "Orders.Create", "Orders.View",
    "Products.View",
    "ESim.View", "ESim.Activate",
    "Users.Create", "Users.View", "Users.Edit",
    "Reports.View",
  ],
  DEALER_STAFF: [
    "Orders.Create", "Orders.View",
    "Products.View",
    "ESim.View",
    "Users.View",
    "Reports.View",
  ],
  SUB_DEALER_ADMIN: [
    "Orders.Create", "Orders.View",
    "Products.View",
    "ESim.View", "ESim.Activate",
    "Users.View",
    "Reports.View",
  ],
  SUB_DEALER_STAFF: [
    "Orders.Create", "Orders.View",
    "Products.View",
    "ESim.View",
    "Users.View",
    "Reports.View",
  ],
  EMPLOYEE: [
    "Orders.View",
    "Products.View",
    "ESim.View",
    "Reports.View",
  ],
  CUSTOMER: [
    "Orders.View",
    "Products.View",
    "ESim.View",
  ],
};

(async () => {
  // ─── Tenant ───
  const t = await p.tenant.upsert({
    where: { slug: "tdp" },
    update: {},
    create: { name: "TDP", slug: "tdp" },
  });
  console.log(`🏢 Tenant: ${t.name}`);

  // ─── Users ───
  const h = await bcrypt.hash("admin123", 12);
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
    console.log(`👤 ${created.email} — ${created.role}`);
  }

  // ─── Permissions ───
  console.log("\n🔑 Seeding permissions...");
  const permissionMap = {}; // code → id

  for (const [code, description] of Object.entries(ALL_PERMISSIONS)) {
    const group = code.split(".")[0];
    const perm = await p.permission.upsert({
      where: { code },
      update: { description, group },
      create: { code, description, group },
    });
    permissionMap[code] = perm.id;
  }
  console.log(`   ✅ ${Object.keys(ALL_PERMISSIONS).length} permissions created`);

  // ─── Role Permissions ───
  console.log("\n🔗 Assigning role permissions...");
  let rpCount = 0;

  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const code of permissions) {
      const permId = permissionMap[code];
      if (!permId) continue;
      await p.rolePermission.upsert({
        where: {
          role_permissionId: { role, permissionId: permId },
        },
        update: {},
        create: { role, permissionId: permId },
      });
      rpCount++;
    }
    console.log(`   ✅ ${role}: ${permissions.length} permissions`);
  }
  console.log(`   🎯 Total: ${rpCount} role-permission assignments`);

  await p.$disconnect();
  console.log("\n📦 Hepsi hazır! Şifre: admin123");
})();
