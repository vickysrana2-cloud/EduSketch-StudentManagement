import { UserSummaryDto } from "./user.types";

/**
 * Student Profiles Module Enums & Interfaces
 */

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum BloodGroup {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-",
}

export enum ParentRelationship {
  FATHER = "FATHER",
  MOTHER = "MOTHER",
  GUARDIAN = "GUARDIAN",
  OTHER = "OTHER",
}

export enum StudentProfileStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ALUMNI = "ALUMNI",
  TRANSFERRED = "TRANSFERRED",
  SUSPENDED = "SUSPENDED",
}

export interface StudentAddressDto {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface ParentDetailDto {
  name: string;
  relationship: ParentRelationship;
  phone: string;
  email?: string | null;
  occupation?: string | null;
}

export interface StudentProfileResponseDto {
  id: string;
  userId: string | UserSummaryDto;
  institutionId: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: BloodGroup | null;
  address: StudentAddressDto;
  parentDetails: ParentDetailDto[];
  status: StudentProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentProfileDto {
  userId: string;
  institutionId?: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: BloodGroup | null;
  address: StudentAddressDto;
  parentDetails: ParentDetailDto[];
  status?: StudentProfileStatus;
}

export interface UpdateStudentProfileDto {
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup | null;
  address?: Partial<StudentAddressDto>;
  parentDetails?: ParentDetailDto[];
  status?: StudentProfileStatus;
}

export interface QueryStudentProfilesDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: StudentProfileStatus;
  gender?: Gender;
  institutionId?: string;
}

