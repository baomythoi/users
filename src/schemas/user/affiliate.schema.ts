import { JSONSchemaType } from 'ajv';

import {
  GetAffProfileParams,
  SyncAffProfileParams,
  EditAffProfileParams,
  GetAllUsersParams,
  AdminEditProfileParams,
  AdminGetDetailParams,
  GetUsersParams,
  GetUserParams
} from '@interfaces/user-affiliate.interface';

export const GetAffProfileSchema: JSONSchemaType<GetAffProfileParams> = {
  type: 'object',
  required: [],
  properties: {
    uid: { type: 'string', nullable: true },
    userId: { type: 'number', nullable: true },
    userCode: { type: 'string', nullable: true },
    status: {
      type: 'string',
      enum: ['Active', 'Locked', 'Pending_Lock_Approval', 'Pending_Review'],
      nullable: true
    },
  },
  additionalProperties: false
}

export const SyncAffProfileSchema: JSONSchemaType<SyncAffProfileParams> = {
  type: 'object',
  required: ['address', 'districtId', 'insuranceCategory', 'productCode', 'provinceId'],
  properties: {
    provinceId: { type: 'number' },
    districtId: { type: 'number' },
    address: { type: 'string' },
    insuranceCategory: {
      type: 'array',
      items: { type: 'string', enum: ['nhan_tho', 'phi_nhan_tho', 'tai_chinh'] }
    },
    agentCode: { type: 'string', nullable: true },
    productCode: { type: 'array', items: { type: 'string' } },
    participationType: { type: 'string', enum: ['ban_hang'] },
    activityAreaId: { type: 'number', nullable: true },
    professionalExperience: { type: 'string', nullable: true },
    futureOrientation: { type: 'string', nullable: true },
    certificateImages: { type: 'array', items: { type: 'string' }, nullable: true },
    profileImages: { type: 'array', items: { type: 'string' }, nullable: true }
  },
  additionalProperties: false
}

export const EditAffProfileSchema: JSONSchemaType<EditAffProfileParams> = {
  type: 'object',
  required: [],
  properties: {
    provinceId: { type: 'number', nullable: true },
    districtId: { type: 'number', nullable: true },
    address: { type: 'string', nullable: true },
    insuranceCategory: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['nhan_tho', 'phi_nhan_tho', 'tai_ching']
      },
      nullable: true
    },
    agentCode: { type: 'string', nullable: true },
    productCode: {
      type: 'array',
      items: { type: 'string' },
      nullable: true
    },
    activityAreaId: { type: 'number', nullable: true },
    professionalExperience: { type: 'string', nullable: true },
    futureOrientation: { type: 'string', nullable: true },
    profileImages: { type: 'array', items: { type: 'string' }, nullable: true },
    certificateImages: { type: 'array', items: { type: 'string' }, nullable: true }
  },
  additionalProperties: false
}

export const GetAllUsersSchema: JSONSchemaType<GetAllUsersParams> = {
  type: 'object',
  required: ['page', 'pageSize'],
  properties: {
    fromDate: {
      type: 'string',
      pattern: '^(\\d{4})-(\\d{2})-(\\d{2})$',
      nullable: true
    },
    toDate: {
      type: 'string',
      pattern: '^(\\d{4})-(\\d{2})-(\\d{2})$',
      nullable: true
    },
    productCode: {
      type: 'array',
      items: {
        type: 'string'
      },
      nullable: true
    },
    participationType: {
      type: 'string',
      enum: ['ban_hang', 'gioi_thieu'],
      nullable: true
    },
    insuranceCategory: {
      type: 'array',
      items: {
        type: 'string'
      },
      nullable: true
    },
    phoneNumber: {
      type: 'string',
      minLength: 10,
      maxLength: 12,
      nullable: true
    },
    page: { type: 'number' },
    pageSize: { type: 'number' }
  },
  additionalProperties: false
}

export const AdminEditProfileSchema: JSONSchemaType<AdminEditProfileParams> = {
  type: 'object',
  required: ['status', 'uid'],
  properties: {
    status: {
      type: 'string',
      enum: ['Active', 'Locked', 'Pending_Lock_Approval', 'Pending_Review']
    },
    uid: { type: 'string' },
    reasonForSuspension: { type: 'string', nullable: true }
  },
  additionalProperties: false
}

export const AdminGetDetailSchema: JSONSchemaType<AdminGetDetailParams> = {
  type: 'object',
  required: ['uid'],
  properties: {
    uid: { type: 'string' }
  },
  additionalProperties: false
}

export const GetUsersSchema: JSONSchemaType<GetUsersParams> = {
  type: 'object',
  required: ['page', 'pageSize'],
  properties: {
    page: { type: 'number', minimum: 1 },
    pageSize: { type: 'number', minimum: 1 }
  },
  additionalProperties: false
}

export const GetUserSchema: JSONSchemaType<GetUserParams> = {
  type: 'object',
  required: ['uid'],
  properties: {
    uid: { type: 'string' },
  },
  additionalProperties: false
}