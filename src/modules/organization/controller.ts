

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  DistributorService,
  DealerService,
  SubDealerService,
  EmployeeService,
  CustomerService,
} from "./service";
import { PriceGroupService } from "./price-group.service";
import { sendSuccess, sendCreated, sendNoContent } from "@/lib/response";
import { handleApiError } from "@/lib/error-handler";

// ─── Zod Schemas ───

const distributorSchema = z.object({
  name: z.string().min(1, "İsim gereklidir"),
  code: z.string().min(1, "Kod gereklidir"),
  email: z.string().email("Geçerli e-posta girin"),
  phone: z.string().optional(),
  address: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  priceGroupId: z.string().optional(),
});

const distributorUpdateSchema = distributorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const dealerSchema = z.object({
  distributorId: z.string().min(1, "Distribütör gereklidir"),
  name: z.string().min(1, "İsim gereklidir"),
  code: z.string().min(1, "Kod gereklidir"),
  email: z.string().email("Geçerli e-posta girin"),
  phone: z.string().optional(),
  address: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  priceGroupId: z.string().optional(),
});

const dealerUpdateSchema = dealerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const subDealerSchema = z.object({
  dealerId: z.string().min(1, "Dealer gereklidir"),
  distributorId: z.string().min(1, "Distribütör gereklidir"),
  name: z.string().min(1, "İsim gereklidir"),
  code: z.string().min(1, "Kod gereklidir"),
  email: z.string().email("Geçerli e-posta girin"),
  phone: z.string().optional(),
  address: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  priceGroupId: z.string().optional(),
});

const subDealerUpdateSchema = subDealerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const employeeSchema = z.object({
  email: z.string().email("Geçerli e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  firstName: z.string().min(1, "Ad gereklidir"),
  lastName: z.string().min(1, "Soyad gereklidir"),
  role: z.enum(["EMPLOYEE", "DISTRIBUTOR_STAFF", "DEALER_STAFF", "SUB_DEALER_STAFF"]),
  distributorId: z.string().optional(),
  dealerId: z.string().optional(),
  subDealerId: z.string().optional(),
});

const employeeUpdateSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isActive: z.boolean().optional(),
  distributorId: z.string().nullable().optional(),
  dealerId: z.string().nullable().optional(),
  subDealerId: z.string().nullable().optional(),
});

// ─── Helpers ───

const TENANT_ID = "default"; // TODO: JWT'den al

function parseQuery(req: NextRequest) {
  const url = new URL(req.url);
  return {
    search: url.searchParams.get("search") || undefined,
    isActive: url.searchParams.get("isActive") !== null
      ? url.searchParams.get("isActive") === "true"
      : undefined,
    distributorId: url.searchParams.get("distributorId") || undefined,
    dealerId: url.searchParams.get("dealerId") || undefined,
    subDealerId: url.searchParams.get("subDealerId") || undefined,
    page: parseInt(url.searchParams.get("page") || "1", 10),
    pageSize: parseInt(url.searchParams.get("pageSize") || "20", 10),
  };
}

// ─── Distributor Controller ───

export const distributorController = {
  async list(req: NextRequest) {
    const service = new DistributorService();
    const query = parseQuery(req);
    const result = await service.list({ ...query, tenantId: TENANT_ID });
    return sendSuccess(result.data, { page: result.page, pageSize: result.pageSize, total: result.total });
  },

  async getById(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new DistributorService();
    const result = await service.getById(params.id);
    return sendSuccess(result);
  },

  async create(req: NextRequest) {
    const body = await req.json();
    const input = distributorSchema.parse(body);
    const service = new DistributorService();
    const result = await service.create(TENANT_ID, input);
    return sendCreated(result);
  },

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    const input = distributorUpdateSchema.parse(body);
    const service = new DistributorService();
    const result = await service.update(params.id, input);
    return sendSuccess(result);
  },

  async toggleStatus(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new DistributorService();
    const result = await service.toggleStatus(params.id);
    return sendSuccess(result);
  },

  async delete(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new DistributorService();
    await service.delete(params.id);
    return sendSuccess({ deleted: true });
  },
};

export const dealerController = {
  async list(req: NextRequest) {
    const service = new DealerService();
    const query = parseQuery(req);
    const result = await service.list({ ...query, tenantId: TENANT_ID });
    return sendSuccess(result.data, { page: result.page, pageSize: result.pageSize, total: result.total });
  },

  async getById(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new DealerService();
    const result = await service.getById(params.id);
    return sendSuccess(result);
  },

  async create(req: NextRequest) {
    const body = await req.json();
    const input = dealerSchema.parse(body);
    const service = new DealerService();
    const result = await service.create(TENANT_ID, input);
    return sendCreated(result);
  },

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    const input = dealerUpdateSchema.parse(body);
    const service = new DealerService();
    const result = await service.update(params.id, input);
    return sendSuccess(result);
  },

  async toggleStatus(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new DealerService();
    const result = await service.toggleStatus(params.id);
    return sendSuccess(result);
  },

  async delete(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new DealerService();
    await service.delete(params.id);
    return sendSuccess({ deleted: true });
  },
};

export const subDealerController = {
  async list(req: NextRequest) {
    const service = new SubDealerService();
    const query = parseQuery(req);
    const result = await service.list({ ...query, tenantId: TENANT_ID });
    return sendSuccess(result.data, { page: result.page, pageSize: result.pageSize, total: result.total });
  },

  async getById(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new SubDealerService();
    const result = await service.getById(params.id);
    return sendSuccess(result);
  },

  async create(req: NextRequest) {
    const body = await req.json();
    const input = subDealerSchema.parse(body);
    const service = new SubDealerService();
    const result = await service.create(TENANT_ID, input);
    return sendCreated(result);
  },

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    const input = subDealerUpdateSchema.parse(body);
    const service = new SubDealerService();
    const result = await service.update(params.id, input);
    return sendSuccess(result);
  },

  async toggleStatus(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new SubDealerService();
    const result = await service.toggleStatus(params.id);
    return sendSuccess(result);
  },

  async delete(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new SubDealerService();
    await service.delete(params.id);
    return sendSuccess({ deleted: true });
  },
};

const priceGroupSchema = z.object({
  name: z.string().min(1, "İsim gereklidir"),
  markupPercent: z.number().min(0).max(999),
});

const priceGroupUpdateSchema = priceGroupSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const priceGroupController = {
  async list(req: NextRequest) {
    const service = new PriceGroupService();
    const query = parseQuery(req);
    const result = await service.list({ ...query, tenantId: TENANT_ID });
    return sendSuccess(result.data, { page: result.page, pageSize: result.pageSize, total: result.total });
  },

  async getById(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new PriceGroupService();
    const result = await service.getById(params.id);
    return sendSuccess(result);
  },

  async create(req: NextRequest) {
    const body = await req.json();
    const input = priceGroupSchema.parse(body);
    const service = new PriceGroupService();
    const result = await service.create(TENANT_ID, input);
    return sendCreated(result);
  },

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    const input = priceGroupUpdateSchema.parse(body);
    const service = new PriceGroupService();
    const result = await service.update(params.id, input);
    return sendSuccess(result);
  },

  async toggleStatus(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new PriceGroupService();
    const result = await service.toggleStatus(params.id);
    return sendSuccess(result);
  },

  async delete(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new PriceGroupService();
    await service.delete(params.id);
    return sendSuccess({ deleted: true });
  },
};

// ─── Customer Controller ───

const customerSchema = z.object({
  email: z.string().email("Geçerli e-posta girin"),
  firstName: z.string().min(1, "Ad gereklidir"),
  lastName: z.string().min(1, "Soyad gereklidir"),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
  distributorId: z.string().optional(),
  dealerId: z.string().optional(),
  subDealerId: z.string().optional(),
});

const customerUpdateSchema = customerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const customerController = {
  async list(req: NextRequest) {
    const service = new CustomerService();
    const query = parseQuery(req);
    const result = await service.list({ ...query, tenantId: TENANT_ID });
    return sendSuccess(result.data, { page: result.page, pageSize: result.pageSize, total: result.total });
  },

  async getById(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new CustomerService();
    const result = await service.getById(params.id);
    return sendSuccess(result);
  },

  async create(req: NextRequest) {
    const body = await req.json();
    const input = customerSchema.parse(body);
    const service = new CustomerService();
    const result = await service.create(TENANT_ID, input);
    return sendCreated(result);
  },

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    const input = customerUpdateSchema.parse(body);
    const service = new CustomerService();
    const result = await service.update(params.id, input);
    return sendSuccess(result);
  },

  async toggleStatus(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new CustomerService();
    const result = await service.toggleStatus(params.id);
    return sendSuccess(result);
  },

  async delete(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new CustomerService();
    await service.delete(params.id);
    return sendSuccess({ deleted: true });
  },
};

// ─── Employee Controller ───

export const employeeController = {
  async list(req: NextRequest) {
    const service = new EmployeeService();
    const query = parseQuery(req);
    const result = await service.list({ ...query, tenantId: TENANT_ID });
    return sendSuccess(result.data, { page: result.page, pageSize: result.pageSize, total: result.total });
  },

  async getById(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new EmployeeService();
    const result = await service.getById(params.id);
    return sendSuccess(result);
  },

  async create(req: NextRequest) {
    const body = await req.json();
    const input = employeeSchema.parse(body);
    const service = new EmployeeService();
    const result = await service.create(TENANT_ID, input);
    return sendCreated(result);
  },

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    const input = employeeUpdateSchema.parse(body);
    const service = new EmployeeService();
    const result = await service.update(params.id, input);
    return sendSuccess(result);
  },

  async toggleStatus(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new EmployeeService();
    const result = await service.toggleStatus(params.id);
    return sendSuccess(result);
  },

  async delete(_req: NextRequest, { params }: { params: { id: string } }) {
    const service = new EmployeeService();
    await service.delete(params.id);
    return sendSuccess({ deleted: true });
  },
};

