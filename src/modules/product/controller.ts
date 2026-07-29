import { NextRequest } from "next/server";
import { z } from "zod";
import { ProductService } from "./service";
import { sendSuccess, sendCreated, sendNoContent } from "@/lib/response";
import { handleApiError } from "@/lib/error-handler";

// ─── Zod Schemas ───

const productUpdateSchema = z.object({
  dealerPrice: z.number().min(0).optional(),
  profitMargin: z.number().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

// ─── Helpers ───

function getTenantId(req: NextRequest): string {
  return req.headers.get("x-user-tenant-id") ?? "default";
}

function parseProductQuery(req: NextRequest) {
  const url = new URL(req.url);
  return {
    search: url.searchParams.get("search") || undefined,
    country: url.searchParams.get("country") || undefined,
    isActive:
      url.searchParams.get("isActive") !== null
        ? url.searchParams.get("isActive") === "true"
        : undefined,
    gbMin: url.searchParams.get("gbMin") !== null
      ? parseFloat(url.searchParams.get("gbMin")!)
      : undefined,
    gbMax: url.searchParams.get("gbMax") !== null
      ? parseFloat(url.searchParams.get("gbMax")!)
      : undefined,
    priceMin: url.searchParams.get("priceMin") !== null
      ? parseFloat(url.searchParams.get("priceMin")!)
      : undefined,
    priceMax: url.searchParams.get("priceMax") !== null
      ? parseFloat(url.searchParams.get("priceMax")!)
      : undefined,
    page: parseInt(url.searchParams.get("page") || "1", 10),
    pageSize: parseInt(url.searchParams.get("pageSize") || "20", 10),
  };
}

// ─── Controller ───

export const productController = {
  async list(req: NextRequest) {
    try {
      const service = new ProductService();
      const query = parseProductQuery(req);
      const result = await service.list({ ...query, tenantId: getTenantId(req) });
      return sendSuccess(result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getById(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const service = new ProductService();
      const result = await service.getById(params.id);
      return sendSuccess(result);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const body = await req.json();
      const input = productUpdateSchema.parse(body);
      const service = new ProductService();
      const result = await service.update(params.id, input);
      return sendSuccess(result);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async toggleStatus(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const service = new ProductService();
      const result = await service.toggleStatus(params.id);
      return sendSuccess(result);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async sync(req: NextRequest) {
    try {
      const service = new ProductService();
      const result = await service.syncFromProvider(getTenantId(req));
      return sendSuccess(result);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async countries(req: NextRequest) {
    try {
      const service = new ProductService();
      const result = await service.getCountries(getTenantId(req));
      return sendSuccess(result);
    } catch (error) {
      return handleApiError(error);
    }
  },
};
