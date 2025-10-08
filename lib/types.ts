import { User as PrismaUser, Script as PrismaScript, AuditLog as PrismaAuditLog, Role, LogStatus } from '@prisma/client';

export type User = PrismaUser;
export type Script = PrismaScript;
export type AuditLog = PrismaAuditLog;

export type UserRole = Role;
export type AuditLogStatus = LogStatus;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  dbTenantId: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface ScriptExecutionRequest {
  scriptId: string;
  bearerToken: string;
  parameters?: Record<string, any>;
}