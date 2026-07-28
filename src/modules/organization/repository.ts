
import { BaseRepository } from "@/lib/repository";
import type {
  Distributor,
  Dealer,
  SubDealer,
  User,
  Customer,
  Prisma,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  OrganizationQuery,
  DealerQuery,
  SubDealerQuery,
  EmployeeQuery,
  CustomerQuery,
  CreateDistributorInput,
  CreateDealerInput,
  CreateSubDealerInput,
  CreateEmployeeInput,
  UpdateDistributorInput,
  UpdateDealerInput,
  UpdateSubDealerInput,
  UpdateEmployeeInput,
} from "./types";

// ─── Distributor ───

export class DistributorRepository extends BaseRepository<
  Distributor,
  Prisma.DistributorCreateInput,
  Prisma.DistributorUpdateInput
> {
  constructor() { super("distributor"); }

  async findManyByTenant(query: OrganizationQuery) {
    const { tenantId, search, isActive, page = 1, pageSize = 20 } = query;
    const where: Prisma.DistributorWhereInput = { tenantId, deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { code: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ];
    }
    if (isActive !== undefined) { where.isActive = isActive; }

    const [data, total] = await Promise.all([
      prisma.distributor.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          priceGroup: { select: { id: true, name: true, markupPercent: true } },
          _count: { select: { dealers: true, subDealers: true, users: true, customers: true } },
        },
      }),
      prisma.distributor.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }
}

// ─── Dealer ───

export class DealerRepository extends BaseRepository<
  Dealer,
  Prisma.DealerCreateInput,
  Prisma.DealerUpdateInput
> {
  constructor() { super("dealer"); }

  async findManyByTenant(query: DealerQuery) {
    const { tenantId, distributorId, search, isActive, page = 1, pageSize = 20 } = query;
    const where: Prisma.DealerWhereInput = { tenantId, deletedAt: null };
    if (distributorId) { where.distributorId = distributorId; }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { code: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ];
    }
    if (isActive !== undefined) { where.isActive = isActive; }

    const [data, total] = await Promise.all([
      prisma.dealer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          distributor: { select: { id: true, name: true, code: true } },
          priceGroup: { select: { id: true, name: true, markupPercent: true } },
          _count: { select: { subDealers: true, users: true, customers: true } },
        },
      }),
      prisma.dealer.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }
}

// ─── SubDealer ───

export class SubDealerRepository extends BaseRepository<
  SubDealer,
  Prisma.SubDealerCreateInput,
  Prisma.SubDealerUpdateInput
> {
  constructor() { super("subDealer"); }

  async findManyByTenant(query: SubDealerQuery) {
    const { tenantId, dealerId, distributorId, search, isActive, page = 1, pageSize = 20 } = query;
    const where: Prisma.SubDealerWhereInput = { tenantId, deletedAt: null };
    if (dealerId) { where.dealerId = dealerId; }
    if (distributorId) { where.distributorId = distributorId; }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { code: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ];
    }
    if (isActive !== undefined) { where.isActive = isActive; }

    const [data, total] = await Promise.all([
      prisma.subDealer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          dealer: { select: { id: true, name: true, code: true } },
          distributor: { select: { id: true, name: true, code: true } },
          priceGroup: { select: { id: true, name: true, markupPercent: true } },
          _count: { select: { users: true, customers: true } },
        },
      }),
      prisma.subDealer.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }
}

// ─── Employee ───

const EMPLOYEE_ROLES: UserRole[] = [
  "EMPLOYEE",
  "DISTRIBUTOR_STAFF",
  "DEALER_STAFF",
  "SUB_DEALER_STAFF",
];

export class EmployeeRepository {
  async findManyByTenant(query: EmployeeQuery) {
    const { tenantId, distributorId, dealerId, subDealerId, search, isActive, page = 1, pageSize = 20 } = query;
    const where: Prisma.UserWhereInput = {
      tenantId,
      deletedAt: null,
      role: { in: EMPLOYEE_ROLES },
    };
    if (distributorId !== undefined) { where.distributorId = distributorId; }
    if (dealerId !== undefined) { where.dealerId = dealerId; }
    if (subDealerId !== undefined) { where.subDealerId = subDealerId; }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" as const } },
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
      ];
    }
    if (isActive !== undefined) { where.isActive = isActive; }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, createdAt: true,
          distributor: { select: { id: true, name: true } },
          dealer: { select: { id: true, name: true } },
          subDealer: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, distributorId: true, dealerId: true,
        subDealerId: true, createdAt: true, updatedAt: true,
        distributor: { select: { id: true, name: true } },
        dealer: { select: { id: true, name: true } },
        subDealer: { select: { id: true, name: true } },
      },
    });
  }
}

// ─── Customer ───

export class CustomerRepository extends BaseRepository<
  Customer,
  Prisma.CustomerCreateInput,
  Prisma.CustomerUpdateInput
> {
  constructor() { super("customer"); }

  async findManyByTenant(query: CustomerQuery) {
    const { tenantId, distributorId, dealerId, subDealerId, search, isActive, page = 1, pageSize = 20 } = query;
    const where: Prisma.CustomerWhereInput = { tenantId, deletedAt: null };
    if (distributorId) { where.distributorId = distributorId; }
    if (dealerId) { where.dealerId = dealerId; }
    if (subDealerId) { where.subDealerId = subDealerId; }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" as const } },
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
      ];
    }
    if (isActive !== undefined) { where.isActive = isActive; }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          distributor: { select: { id: true, name: true } },
          dealer: { select: { id: true, name: true } },
          subDealer: { select: { id: true, name: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }
}
