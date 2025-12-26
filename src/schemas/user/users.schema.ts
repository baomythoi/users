import { JSONSchemaType } from 'ajv';
import {
  GetTotalUsersParams,
  GetUsersCountByPackageParams,
  GetUsersGrowthByMonthParams,
  SetUserStatusParams,
  UserDetailParams,
  UsersListParams
} from '@interfaces/user';

export const GetUsersListSchema: JSONSchemaType<UsersListParams> = {
  type: 'object',
  properties: {
    page: { type: 'number', minimum: 1 },
    pageSize: { type: 'number', minimum: 1, maximum: 100 },
    status: { type: 'number', enum: [0, 1, 2], nullable: true }, // 0: inactive, 1: active, 2: pending
    roleId: { type: 'number', minimum: 1, nullable: true },
    search: { type: 'string', minLength: 1, nullable: true },
    packageCode: { type: 'string', minLength: 1, nullable: true }
  },
  required: ['page', 'pageSize'],
  additionalProperties: false
};

export const UserDetailParamsSchema: JSONSchemaType<UserDetailParams> = {
  type: 'object',
  properties: {
    userUid: { type: 'string', format: 'uuid' }
  },
  required: ['userUid'],
  additionalProperties: false
};

export const SetUserStatusParamsSchema: JSONSchemaType<SetUserStatusParams> = {
  type: 'object',
  properties: {
    userUid: { type: 'string', format: 'uuid', minLength: 1 },
    status: { type: 'number', enum: [0, 1, 2] } // 0: inactive, 1: active, 2: suspended
  },
  required: ['userUid', 'status'],
  additionalProperties: false
};

export const GetTotalUsersParamsSchema: JSONSchemaType<GetTotalUsersParams> = {
  type: 'object',
  properties: {
    status: { type: 'number', enum: [0, 1, 2], nullable: true }, // 0: inactive, 1: active, 2: pending
    startDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true }, // YYYY-MM-DD
    endDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true },   // YYYY-MM-DD
  },
  required: [],
  additionalProperties: false
};

export const GetUsersCountByPackageParamsSchema: JSONSchemaType<GetUsersCountByPackageParams> = {
  type: 'object',
  properties: {
    startDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true }, // YYYY-MM-DD
    endDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true },   // YYYY-MM-DD
  },
  required: [],
  additionalProperties: false
};

export const GetUsersGrowthByMonthParamsSchema: JSONSchemaType<GetUsersGrowthByMonthParams> = {
  type: 'object',
  properties: {
    startDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true }, // YYYY-MM-DD
    endDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true },   // YYYY-MM-DD
  },
  required: [],
  additionalProperties: false
};