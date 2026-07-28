import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/auth/with-permission";
import { sendSuccess, sendCreated } from "@/lib/response";
import { handleApiError } from "@/lib/error-handler";

export const GET = withPermission("Employees.View", async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const where: Record<string, unknown> = {};
  if (customerId) where.customerId = customerId;

  const [data, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.supportTicket.count({ where }),
  ]);
  return sendSuccess(data, { page, pageSize, total });
});

export const POST = withPermission("Employees.Create", async (req: NextRequest) => {
  try {
    const { customerId, subject, description, priority } = await req.json();
    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: "default",
        customerId,
        subject,
        description: description ?? null,
        priority: priority ?? "NORMAL",
      },
      include: { customer: { select: { firstName: true, lastName: true } } },
    });
    return sendCreated(ticket);
  } catch (e) { return handleApiError(e); }
});

export const runtime = "nodejs";
