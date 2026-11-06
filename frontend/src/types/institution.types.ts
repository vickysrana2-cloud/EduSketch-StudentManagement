/**
 * Institution Module Types & Enums
 */

export enum InstitutionType {
  SCHOOL = "SCHOOL",
  COLLEGE = "COLLEGE",
  UNIVERSITY = "UNIVERSITY",
}

export enum InstitutionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum SubscriptionPlan {
  BASIC = "BASIC",
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  SUSPENDED = "SUSPENDED",
}

export interface InstitutionAddressDto {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface InstitutionSubscriptionDto {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
}

export interface InstitutionResponseDto {
  id: string;
  name: string;
  code: string;
  type: InstitutionType;
  email: string;
  phone: string;
  address: InstitutionAddressDto;
  website?: string | null;
  subscription: InstitutionSubscriptionDto;
  status: InstitutionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstitutionDto {
  name: string;
  code: string;
  type: InstitutionType;
  email: string;
  phone: string;
  address: InstitutionAddressDto;
  website?: string;
  subscription: InstitutionSubscriptionDto;
}

export interface UpdateInstitutionDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: Partial<InstitutionAddressDto>;
  website?: string;
  subscription?: Partial<InstitutionSubscriptionDto>;
}

export interface UpdateInstitutionStatusDto {
  status: InstitutionStatus;
  reason?: string;
}

export interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
}

export interface QueryInstitutionsDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: InstitutionStatus;
  type?: InstitutionType;
}

