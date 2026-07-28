import { prisma } from "@/lib/prisma";

/**
 * Write an audit log entry.
 * Called from controllers/services after meaningful mutations.
 */
export async function writeAuditLog(params: {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        oldValue: params.oldValue ?? undefined,
        newValue: params.newValue ?? undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch {
    // Audit logging should never break the main flow
    console.error("[Audit] Failed to write audit log:", params.action, params.entity);
  }
}

/**
 * Read audit logs for a given entity.
 */
export async function getAuditLogs(params: {
  entity?: string;
  entityId?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { entity, entityId, tenantId, page = 1, pageSize = 30 } = params;
  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;
  if (tenantId) where.tenantId = tenantId;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { data, total, page, pageSize };
}
