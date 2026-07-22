import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

/**
 * Base repository with common CRUD operations.
 * Each module extends this with domain-specific queries.
 */
export class BaseRepository<T, CreateInput, UpdateInput> {
  protected model: string;

  constructor(modelName: string) {
    this.model = modelName;
  }

  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
    include?: Record<string, unknown>;
  }): Promise<T[]> {
    return (prisma as any)[this.model].findMany(params ?? {}) as Promise<T[]>;
  }

  async findById(
    id: string,
    include?: Record<string, unknown>,
  ): Promise<T | null> {
    return (prisma as any)[this.model].findUnique({
      where: { id },
      include,
    }) as Promise<T | null>;
  }

  async findByIdOrThrow(id: string, include?: Record<string, unknown>): Promise<T> {
    const record = await this.findById(id, include);
    if (!record) {
      throw new NotFoundError(this.model, id);
    }
    return record;
  }

  async create(data: CreateInput): Promise<T> {
    return (prisma as any)[this.model].create({ data }) as Promise<T>;
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return (prisma as any)[this.model].update({
      where: { id },
      data,
    }) as Promise<T>;
  }

  async delete(id: string): Promise<T> {
    return (prisma as any)[this.model].update({
      where: { id },
      data: { deleted_at: new Date() },
    }) as Promise<T>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return (prisma as any)[this.model].count({ where }) as Promise<number>;
  }
}
