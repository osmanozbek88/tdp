import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { PrismaClient } from "@prisma/client";

type PrismaModel = keyof Omit<
  PrismaClient,
  | "$connect"
  | "$disconnect"
  | "$on"
  | "$transaction"
  | "$use"
  | "$extends"
  | "$executeRaw"
  | "$executeRawUnsafe"
  | "$queryRaw"
  | "$queryRawUnsafe"
  | "$runCommandRaw"
  | symbol
>;

/**
 * Base repository with common CRUD operations.
 * Each module extends this with domain-specific queries.
 */
export class BaseRepository<T, CreateInput, UpdateInput> {
  protected model: PrismaModel;

  constructor(modelName: PrismaModel) {
    this.model = modelName;
  }

  public delegate(): PrismaClient[PrismaModel] {
    return prisma[this.model];
  }

  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
    include?: Record<string, unknown>;
  }): Promise<T[]> {
    return this.delegate().findMany(params ?? {}) as unknown as Promise<T[]>;
  }

  async findById(
    id: string,
    include?: Record<string, unknown>,
  ): Promise<T | null> {
    return this.delegate().findUnique({
      where: { id },
      include,
    }) as unknown as Promise<T | null>;
  }

  async findByIdOrThrow(id: string, include?: Record<string, unknown>): Promise<T> {
    const record = await this.findById(id, include);
    if (!record) {
      throw new NotFoundError(String(this.model), id);
    }
    return record;
  }

  async create(data: CreateInput): Promise<T> {
    return this.delegate().create({ data }) as unknown as Promise<T>;
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return this.delegate().update({
      where: { id },
      data,
    }) as unknown as Promise<T>;
  }

  async delete(id: string): Promise<T> {
    return this.delegate().update({
      where: { id },
      data: { deletedAt: new Date() },
    }) as unknown as Promise<T>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.delegate().count({ where }) as unknown as Promise<number>;
  }
}
