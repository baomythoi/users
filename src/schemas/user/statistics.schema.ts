import { JSONSchemaType } from 'ajv';
import {
  GetTotalUsersParams,
  GetUsersCountByPackageParams,
  GetUsersGrowthByMonthParams,
} from '@interfaces/statistics.interface';

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