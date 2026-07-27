

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

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
export async function GET(): Promise<NextResponse> {
  try {
    // ─── Date boundaries ───
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ─── Parallel queries ───
    const [
      // Daily sales
      dailySalesResult,
      // Monthly sales
      monthlySalesResult,
      // Today's order count
      todayOrders,
      // This month's order count
      monthOrders,
      // Distributor count (Distributor + Dealer + SubDealer)
      distributorCount,
      dealerCount,
      subDealerCount,
      // Customer count
      customerCount,
      // Recent orders (last 15)
      recentOrders,
      // Provider health
      latestHealthCheck,
    ] = await Promise.all([
      // Daily sales
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "COMPLETED" as OrderStatus,
          createdAt: { gte: todayStart },
        },
      }),
      // Monthly sales
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "COMPLETED" as OrderStatus,
          createdAt: { gte: monthStart },
        },
      }),
      // Today's orders
      prisma.order.count({
        where: { createdAt: { gte: todayStart } },
      }),
      // Monthly orders
      prisma.order.count({
        where: { createdAt: { gte: monthStart } },
      }),
      // Distributor/Dealer/SubDealer counts
      prisma.distributor.count({ where: { deletedAt: null } }),
      prisma.dealer.count({ where: { deletedAt: null } }),
      prisma.subDealer.count({ where: { deletedAt: null } }),
      // Customer count
      prisma.customer.count({ where: { deletedAt: null } }),
      // Recent orders
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
      // Latest provider health check
      prisma.providerStatus.findFirst({
        orderBy: { checkedAt: "desc" },
      }),
    ]);

    // ─── Build response ───

    const dailySales = Number(dailySalesResult._sum.totalAmount ?? 0);
    const monthlySales = Number(monthlySalesResult._sum.totalAmount ?? 0);
    const totalDistributors = distributorCount + dealerCount + subDealerCount;

    // Format recent orders
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

    // Provider health
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
  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Beklenmeyen hata",
      },
      { status: 500 },
    );
  }
}

