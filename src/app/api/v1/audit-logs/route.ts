import { NextRequest } from "next/server";
import { getAuditLogs } from "@/lib/audit";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("Reports.View", async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity") || undefined;
  const entityId = searchParams.get("entityId") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "30", 10);

  const result = await getAuditLogs({ entity, entityId, page, pageSize });
  return Response.json({ success: true, data: result.data, meta: { page: result.page, pageSize: result.pageSize, total: result.total } });
});

export const runtime = "nodejs";
