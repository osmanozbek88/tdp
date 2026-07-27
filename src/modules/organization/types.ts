
import type { Distributor, Dealer, SubDealer, User, Prisma, UserRole } from "@prisma/client";

// ─── Entity Types ───

export type DistributorWithRelations = Distributor & {
  priceGroup?: { id: string; name: string; markupPercent: Prisma.Decimal } | null;
  _count?: { dealers: number; subDealers: number; users: number; customers: number };
};

export type DealerWithRelations = Dealer & {
  distributor?: { id: string; name: string; code: string } | null;
  priceGroup?: { id: string; name: string; markupPercent: Prisma.Decimal } | null;
  _count?: { subDealers: number; users: number; customers: number };
};

export type SubDealerWithRelations = SubDealer & {
  dealer?: { id: string; name: string; code: string } | null;
  distributor?: { id: string; name: string; code: string } | null;
  priceGroup?: { id: string; name: string; markupPercent: Prisma.Decimal } | null;
  _count?: { users: number; customers: number };
};

export type EmployeeWithRelations = User & {
  distributor?: { id: string; name: string } | null;
  dealer?: { id: string; name: string } | null;
  subDealer?: { id: string; name: string } | null;
};

// ─── Create Input Types ───

export interface CreateDistributorInput {
  name: string;
  code: string;
  email: string;
  phone?: string;
  address?: string;
  commissionRate?: number;
  priceGroupId?: string;
}

export interface CreateDealerInput {
  distributorId: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  address?: string;
  commissionRate?: number;
  priceGroupId?: string;
}

export interface CreateSubDealerInput {
  dealerId: string;
  distributorId: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  address?: string;
  commissionRate?: number;
  priceGroupId?: string;
}

export interface CreateEmployeeInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "EMPLOYEE" | "DISTRIBUTOR_STAFF" | "DEALER_STAFF" | "SUB_DEALER_STAFF";
  distributorId?: string;
  dealerId?: string;
  subDealerId?: string;
}

// ─── Update Input Types ───

export interface UpdateDistributorInput extends Partial<CreateDistributorInput> {
  isActive?: boolean;
}

export interface UpdateDealerInput extends Partial<CreateDealerInput> {
  isActive?: boolean;
}

export interface UpdateSubDealerInput extends Partial<CreateSubDealerInput> {
  isActive?: boolean;
}

export interface UpdateEmployeeInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  distributorId?: string;
  dealerId?: string;
  subDealerId?: string;
}

// ─── Query / Filter Types ───

export interface OrganizationQuery {
  search?: string;
  isActive?: boolean;
  tenantId: string;
  page?: number;
  pageSize?: number;
}

export interface DealerQuery extends OrganizationQuery {
  distributorId?: string;
}

export interface SubDealerQuery extends OrganizationQuery {
  distributorId?: string;
  dealerId?: string;
}

export interface EmployeeQuery extends OrganizationQuery {
  distributorId?: string;
  dealerId?: string;
  subDealerId?: string;
}

// ─── PriceGroup Types ───

export interface CreatePriceGroupInput {
  name: string;
  markupPercent: number;
}

export interface UpdatePriceGroupInput {
  name?: string;
  markupPercent?: number;
  isActive?: boolean;
}

export interface PriceGroupQuery {
  tenantId: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
