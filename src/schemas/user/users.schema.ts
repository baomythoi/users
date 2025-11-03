import { JSONSchemaType } from 'ajv';
import {
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