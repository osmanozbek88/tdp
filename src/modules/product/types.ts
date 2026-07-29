import type { Product, Prisma } from "@prisma/client";

// ─── Entity Types ───

export type ProductWithRelations = Product & {
  tenant?: { id: string; name: string };
};

// ─── Sync Input ───

export interface ProductSyncResult {
  created: number;
  updated: number;
  total: number;
  errors: string[];
}

// ─── Query / Filter Types ───

export interface ProductQuery {
  search?: string;
  country?: string;
  isActive?: boolean;
  gbMin?: number;
  gbMax?: number;
  priceMin?: number;
  priceMax?: number;
  tenantId: string;
  page?: number;
  pageSize?: number;
}

// ─── Update Input ───

export interface UpdateProductInput {
  dealerPrice?: number;
  profitMargin?: number;
  isActive?: boolean;
}
