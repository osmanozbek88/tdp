import { BaseRepository } from "@/lib/repository";
import type { Product, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProductQuery } from "./types";

export class ProductRepository extends BaseRepository<
  Product,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput
> {
  constructor() {
    super("product");
  }

  async findManyByTenant(query: ProductQuery) {
    const {
      tenantId,
      search,
      country,
      isActive,
      gbMin,
      gbMax,
      priceMin,
      priceMax,
      page = 1,
      pageSize = 20,
    } = query;

    const where: Prisma.ProductWhereInput = { tenantId, deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { country: { contains: search, mode: "insensitive" as const } },
        { region: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (country) {
      where.country = { equals: country, mode: "insensitive" as const };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // GB aralığı filtresi
    if (gbMin !== undefined || gbMax !== undefined) {
      (where as any).dataGB = {
        ...(gbMin !== undefined ? { gte: gbMin } : {}),
        ...(gbMax !== undefined ? { lte: gbMax } : {}),
      };
    }

    // Fiyat aralığı filtresi
    if (priceMin !== undefined || priceMax !== undefined) {
      (where as any).price = {
        ...(priceMin !== undefined ? { gte: priceMin } : {}),
        ...(priceMax !== undefined ? { lte: priceMax } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where: where as Record<string, unknown>,
        orderBy: { createdAt: "desc" },
      }),
      this.count(where as Record<string, unknown>),
    ]);

    return { data, total, page, pageSize };
  }

  /** Provider'dan gelen plan ID'sine göre ürün bul */
  async findByTelnaId(telnaProductId: string): Promise<Product | null> {
    return this.findById(telnaProductId) as unknown as Promise<Product | null>;
  }

  /** Sync için: telnaProductId'ye göre upsert */
  async upsertByTelnaId(
    tenantId: string,
    telnaProductId: string,
    data: Prisma.ProductCreateInput
  ): Promise<{ created: boolean; product: Product }> {
    const existing = await (this.delegate() as any).findUnique({
      where: { telnaProductId },
    });

    if (existing) {
      const product = await (this.delegate() as any).update({
        where: { telnaProductId },
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          country: data.country,
          region: data.region,
          currency: data.currency,
          price: data.price,
          costPrice: data.costPrice,
          dataGB: data.dataGB,
          durationDays: data.durationDays,
          specifications: data.specifications,
        },
      });
      return { created: false, product };
    }

    const product = await (this.delegate() as any).create({ data });
    return { created: true, product };
  }

  /** Sync için kullanılacak tüm ülke kodlarını listele */
  async getDistinctCountries(tenantId: string): Promise<string[]> {
    const result = await (this.delegate() as any).findMany({
      where: { tenantId, deletedAt: null },
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    });
    return result.map((r: { country: string }) => r.country);
  }
}
