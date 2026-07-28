import { BaseService } from "@/lib/service";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { PriceGroup } from "@prisma/client";
import type { CreatePriceGroupInput, UpdatePriceGroupInput, PriceGroupQuery } from "./types";

export class PriceGroupService extends BaseService {
  constructor() { super("PriceGroupService"); }

  async list(query: PriceGroupQuery) {
    const { tenantId, search, isActive, page = 1, pageSize = 20 } = query;
    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (isActive !== undefined) { where.isActive = isActive; }

    const [data, total] = await Promise.all([
      prisma.priceGroup.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.priceGroup.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async getById(id: string) {
    const pg = await prisma.priceGroup.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { distributors: true, dealers: true, subDealers: true } },
      },
    });
    if (!pg) throw new NotFoundError("PriceGroup", id);
    return pg;
  }

  async create(tenantId: string, input: CreatePriceGroupInput) {
    const exists = await prisma.priceGroup.findFirst({
      where: { tenantId, name: input.name, deletedAt: null },
    });
    if (exists) throw new ConflictError(`'${input.name}' zaten mevcut.`, "DUPLICATE_NAME");

    return prisma.priceGroup.create({
      data: { ...input, tenantId },
    });
  }

  async update(id: string, input: UpdatePriceGroupInput) {
    return prisma.priceGroup.update({ where: { id }, data: input });
  }

  async toggleStatus(id: string) {
    const pg = await prisma.priceGroup.findUnique({ where: { id } });
    if (!pg) throw new NotFoundError("PriceGroup", id);
    return prisma.priceGroup.update({ where: { id }, data: { isActive: !pg.isActive } });
  }

  async delete(id: string) {
    const pg = await prisma.priceGroup.findUnique({ where: { id } });
    if (!pg) throw new NotFoundError("PriceGroup", id);
    return prisma.priceGroup.update({ where: { id }, data: { isActive: false } });
  }
}
