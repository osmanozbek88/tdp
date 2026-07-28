import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/auth/with-permission";
import { sendSuccess } from "@/lib/response";

export const PATCH = withPermission("Employees.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { status, priority, assignedTo } = await req.json();
  const data: Record<string, unknown> = {};
  if (status) { data.status = status; if (status === "RESOLVED" || status === "CLOSED") data.resolvedAt = new Date(); }
  if (priority) data.priority = priority;
  if (assignedTo !== undefined) data.assignedTo = assignedTo;

  const ticket = await prisma.supportTicket.update({ where: { id: params.id }, data, include: { customer: { select: { firstName: true, lastName: true } } } });
  return sendSuccess(ticket);
});

export const runtime = "nodejs";
