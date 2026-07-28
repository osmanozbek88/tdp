

import { BaseService } from "@/lib/service";
import { AppError, NotFoundError, ConflictError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { hash } from "bcryptjs";
import {
  DistributorRepository,
  DealerRepository,
  SubDealerRepository,
  EmployeeRepository,
  CustomerRepository,
} from "./repository";
import type {
  CreateDistributorInput,
  CreateDealerInput,
  CreateSubDealerInput,
  CreateEmployeeInput,
  CreateCustomerInput,
  UpdateDistributorInput,
  UpdateDealerInput,
  UpdateSubDealerInput,
  UpdateEmployeeInput,
  UpdateCustomerInput,
  OrganizationQuery,
  DealerQuery,
  SubDealerQuery,
  EmployeeQuery,
  CustomerQuery,
} from "./types";

// ─── Distributor Service ───

export class DistributorService extends BaseService {
  private repo = new DistributorRepository();

  constructor() { super("DistributorService"); }

  async list(query: OrganizationQuery) {
    return this.repo.findManyByTenant(query);
  }

  async getById(id: string) {
    const result = await this.repo.findByIdOrThrow(id, {
      priceGroup: { select: { id: true, name: true, markupPercent: true } },
      _count: { select: { dealers: true, subDealers: true, users: true, customers: true } },
    });
    return result;
  }

  async create(tenantId: string, input: CreateDistributorInput) {
    await this.ensureCodeUnique(tenantId, input.code);
    return this.repo.create({
      ...input,
      tenant: { connect: { id: tenantId } },
      ...(input.priceGroupId ? { priceGroup: { connect: { id: input.priceGroupId } } } : {}),
    } as Parameters<typeof this.repo.create>[0]);
  }

  async update(id: string, input: UpdateDistributorInput) {
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) {
        if (k === "priceGroupId") {
          data["priceGroup"] = v ? { connect: { id: v } } : { disconnect: true };
        } else {
          data[k] = v;
        }
      }
    }
    return (this.repo.delegate()).update({ where: { id }, data });
  }

  async toggleStatus(id: string) {
    const entity = await this.repo.findByIdOrThrow(id);
    return (this.repo.delegate()).update({
      where: { id },
      data: { isActive: !entity.isActive },
    });
  }

  async delete(id: string) {
    await this.repo.findByIdOrThrow(id);
    return (this.repo.delegate()).update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  private async ensureCodeUnique(tenantId: string, code: string) {
    const existing = await prisma.distributor.findFirst({ where: { tenantId, code, deletedAt: null } });
    if (existing) throw new ConflictError(`'${code}' kodu zaten kullanımda.`, "DUPLICATE_CODE");
  }
}

// ─── Dealer Service ───

export class DealerService extends BaseService {
  private repo = new DealerRepository();

  constructor() { super("DealerService"); }

  async list(query: DealerQuery) {
    return this.repo.findManyByTenant(query);
  }

  async getById(id: string) {
    return this.repo.findByIdOrThrow(id, {
      distributor: { select: { id: true, name: true, code: true } },
      priceGroup: { select: { id: true, name: true, markupPercent: true } },
      _count: { select: { subDealers: true, users: true, customers: true } },
    });
  }

  async create(tenantId: string, input: CreateDealerInput) {
    await this.ensureCodeUnique(tenantId, input.code);
    return this.repo.create({
      ...input,
      tenant: { connect: { id: tenantId } },
      distributor: { connect: { id: input.distributorId } },
      ...(input.priceGroupId ? { priceGroup: { connect: { id: input.priceGroupId } } } : {}),
    } as Parameters<typeof this.repo.create>[0]);
  }

  async update(id: string, input: UpdateDealerInput) {
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) {
        if (k === "priceGroupId") {
          data["priceGroup"] = v ? { connect: { id: v } } : { disconnect: true };
        } else if (k === "distributorId") {
          data["distributor"] = v ? { connect: { id: v } } : undefined;
        } else {
          data[k] = v;
        }
      }
    }
    return (this.repo.delegate()).update({ where: { id }, data });
  }

  async toggleStatus(id: string) {
    const entity = await this.repo.findByIdOrThrow(id);
    return (this.repo.delegate()).update({
      where: { id },
      data: { isActive: !entity.isActive },
    });
  }

  async delete(id: string) {
    await this.repo.findByIdOrThrow(id);
    return (this.repo.delegate()).update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  private async ensureCodeUnique(tenantId: string, code: string) {
    const existing = await prisma.dealer.findFirst({ where: { tenantId, code, deletedAt: null } });
    if (existing) throw new ConflictError(`'${code}' kodu zaten kullanımda.`, "DUPLICATE_CODE");
  }
}

// ─── SubDealer Service ───

export class SubDealerService extends BaseService {
  private repo = new SubDealerRepository();

  constructor() { super("SubDealerService"); }

  async list(query: SubDealerQuery) {
    return this.repo.findManyByTenant(query);
  }

  async getById(id: string) {
    return this.repo.findByIdOrThrow(id, {
      dealer: { select: { id: true, name: true, code: true } },
      distributor: { select: { id: true, name: true, code: true } },
      priceGroup: { select: { id: true, name: true, markupPercent: true } },
      _count: { select: { users: true, customers: true } },
    });
  }

  async create(tenantId: string, input: CreateSubDealerInput) {
    await this.ensureCodeUnique(tenantId, input.code);
    return this.repo.create({
      ...input,
      tenant: { connect: { id: tenantId } },
      dealer: { connect: { id: input.dealerId } },
      distributor: { connect: { id: input.distributorId } },
      ...(input.priceGroupId ? { priceGroup: { connect: { id: input.priceGroupId } } } : {}),
    } as Parameters<typeof this.repo.create>[0]);
  }

  async update(id: string, input: UpdateSubDealerInput) {
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) {
        if (k === "priceGroupId") {
          data["priceGroup"] = v ? { connect: { id: v } } : { disconnect: true };
        } else if (k === "dealerId") {
          data["dealer"] = v ? { connect: { id: v } } : undefined;
        } else if (k === "distributorId") {
          data["distributor"] = v ? { connect: { id: v } } : undefined;
        } else {
          data[k] = v;
        }
      }
    }
    return (this.repo.delegate()).update({ where: { id }, data });
  }

  async toggleStatus(id: string) {
    const entity = await this.repo.findByIdOrThrow(id);
    return (this.repo.delegate()).update({
      where: { id },
      data: { isActive: !entity.isActive },
    });
  }

  async delete(id: string) {
    await this.repo.findByIdOrThrow(id);
    return (this.repo.delegate()).update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  private async ensureCodeUnique(tenantId: string, code: string) {
    const existing = await prisma.subDealer.findFirst({ where: { tenantId, code, deletedAt: null } });
    if (existing) throw new ConflictError(`'${code}' kodu zaten kullanımda.`, "DUPLICATE_CODE");
  }
}

// ─── Employee Service ───

export class EmployeeService extends BaseService {
  private repo = new EmployeeRepository();

  constructor() { super("EmployeeService"); }

  async list(query: EmployeeQuery) {
    return this.repo.findManyByTenant(query);
  }

  async getById(id: string) {
    const employee = await this.repo.findById(id);
    if (!employee) throw new NotFoundError("Employee", id);
    return employee;
  }

  async create(tenantId: string, input: CreateEmployeeInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError(`'${input.email}' email adresi zaten kayıtlı.`, "DUPLICATE_EMAIL");

    const passwordHash = await hash(input.password, 12);
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role as import("@prisma/client").UserRole,
        tenantId,
        distributorId: input.distributorId ?? null,
        dealerId: input.dealerId ?? null,
        subDealerId: input.subDealerId ?? null,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true,
        distributor: { select: { id: true, name: true } },
        dealer: { select: { id: true, name: true } },
        subDealer: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, input: UpdateEmployeeInput) {
    const data: Record<string, unknown> = {};
    if (input.email !== undefined) data.email = input.email;
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.distributorId !== undefined) data.distributorId = input.distributorId || null;
    if (input.dealerId !== undefined) data.dealerId = input.dealerId || null;
    if (input.subDealerId !== undefined) data.subDealerId = input.subDealerId || null;

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true,
        distributor: { select: { id: true, name: true } },
        dealer: { select: { id: true, name: true } },
        subDealer: { select: { id: true, name: true } },
      },
    });
  }

  async toggleStatus(id: string) {
    const entity = await prisma.user.findUnique({ where: { id }, select: { id: true, isActive: true } });
    if (!entity) throw new NotFoundError("Employee", id);
    return prisma.user.update({
      where: { id },
      data: { isActive: !entity.isActive },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, isActive: true,
        distributor: { select: { id: true, name: true } },
        dealer: { select: { id: true, name: true } },
        subDealer: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    await prisma.user.findUniqueOrThrow({ where: { id } });
    return prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

// ─── Customer Service ───

export class CustomerService extends BaseService {
  private repo = new CustomerRepository();

  constructor() { super("CustomerService"); }

  async list(query: CustomerQuery) {
    return this.repo.findManyByTenant(query);
  }

  async getById(id: string) {
    const result = await this.repo.findById(id, {
      distributor: { select: { id: true, name: true, code: true } },
      dealer: { select: { id: true, name: true, code: true } },
      subDealer: { select: { id: true, name: true, code: true } },
      orders: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { product: { select: { name: true } } } },
        },
      },
      esims: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    });
    if (!result || result.deletedAt) throw new NotFoundError("Customer", id);
    return result;
  }

  async create(tenantId: string, input: CreateCustomerInput) {
    const existing = await prisma.customer.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError(`'${input.email}' email adresi zaten kayıtlı.`, "DUPLICATE_EMAIL");

    const result = await this.repo.create({
      ...input,
      tenant: { connect: { id: tenantId } },
      ...(input.distributorId ? { distributor: { connect: { id: input.distributorId } } } : {}),
      ...(input.dealerId ? { dealer: { connect: { id: input.dealerId } } } : {}),
      ...(input.subDealerId ? { subDealer: { connect: { id: input.subDealerId } } } : {}),
    } as Parameters<typeof this.repo.create>[0]);

    await writeAuditLog({ tenantId, action: "CREATE", entity: "Customer", entityId: result.id, newValue: input as Record<string, unknown> }).catch(() => {});
    return result;
  }

  async update(id: string, input: UpdateCustomerInput) {
    const data: Record<string, unknown> = {};
    if (input.email !== undefined) data.email = input.email;
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.countryCode !== undefined) data.countryCode = input.countryCode;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.distributorId !== undefined) data.distributorId = input.distributorId || null;
    if (input.dealerId !== undefined) data.dealerId = input.dealerId || null;
    if (input.subDealerId !== undefined) data.subDealerId = input.subDealerId || null;

    const result = await (this.repo.delegate()).update({ where: { id }, data });
    await writeAuditLog({ tenantId: "default", action: "UPDATE", entity: "Customer", entityId: id, newValue: input as Record<string, unknown> }).catch(() => {});
    return result;
  }

  async toggleStatus(id: string) {
    const entity = await this.repo.findByIdOrThrow(id);
    const result = await (this.repo.delegate()).update({
      where: { id },
      data: { isActive: !entity.isActive },
    });
    await writeAuditLog({ tenantId: "default", action: entity.isActive ? "DEACTIVATE" : "ACTIVATE", entity: "Customer", entityId: id }).catch(() => {});
    return result;
  }

  async delete(id: string) {
    await this.repo.findByIdOrThrow(id);
    const result = await (this.repo.delegate()).update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await writeAuditLog({ tenantId: "default", action: "DELETE", entity: "Customer", entityId: id }).catch(() => {});
    return result;
  }
}

