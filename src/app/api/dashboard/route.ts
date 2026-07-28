import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import { withPermission } from "@/lib/auth/with-permission";

/**
 * GET /api/dashboard
 *
 * Returns dashboard widget data:
 *   - Sales (daily / monthly)
 *   - Order count (today / this month)
 *   - Distributor / customer counts
 *   - Recent orders
 *   - Provider health status
 */
export const GET = withPermission("Reports.View", async (_req: NextRequest) => {
  // ─── Date boundaries ───
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // ─── Parallel queries ───
  const [
    dailySalesResult,
    monthlySalesResult,
    todayOrders,
    monthOrders,
    distributorCount,
    dealerCount,
    subDealerCount,
    customerCount,
    recentOrders,
    latestHealthCheck,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: "COMPLETED" as OrderStatus,
        createdAt: { gte: todayStart },
      },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: "COMPLETED" as OrderStatus,
        createdAt: { gte: monthStart },
      },
    }),
    prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.distributor.count({ where: { deletedAt: null } }),
    prisma.dealer.count({ where: { deletedAt: null } }),
    prisma.subDealer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.order.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    }),
    prisma.providerStatus.findFirst({
      orderBy: { checkedAt: "desc" },
    }),
  ]);

  // ─── Build response ───

  const dailySales = Number(dailySalesResult._sum.totalAmount ?? 0);
  const monthlySales = Number(monthlySalesResult._sum.totalAmount ?? 0);
  const totalDistributors = distributorCount + dealerCount + subDealerCount;

  const orders = recentOrders.map((order) => ({
    orderId: order.orderNumber,
    customerName: order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : "Bilinmeyen",
    customerEmail: order.customer?.email ?? "",
    productName: order.items[0]?.product?.name ?? "Bilinmeyen Ürün",
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  }));

  const providerHealth = latestHealthCheck
    ? {
        status: latestHealthCheck.status,
        latencyMs: latestHealthCheck.latencyMs,
        uptimePercentage30d: Number(latestHealthCheck.uptimePercentage30d),
        lastCheckedAt: latestHealthCheck.checkedAt.toISOString(),
      }
    : null;

  return NextResponse.json({
    success: true,
    data: {
      sales: {
        daily: dailySales,
        monthly: monthlySales,
        currency: "USD",
      },
      orderCount: {
        today: todayOrders,
        thisMonth: monthOrders,
      },
      accounts: {
        distributors: totalDistributors,
        customers: customerCount,
      },
      recentOrders: orders,
      providerHealth,
    },
  });
});
