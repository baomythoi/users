import { JSONSchemaType } from 'ajv';
import {
  ProfileParams,
  EditUserProfileParams,
  EditUserPortalProfileParams,
  ChangePasswordParams,
  RegGSaleAccountParams,
  GetAffUserByRoleParams,
} from '@interfaces/user';

export const ProfileSchema: JSONSchemaType<ProfileParams> = {
  type: 'object',
  properties: {
    uid: { type: 'string', nullable: true },
    userId: { type: 'number', nullable: true },
    username: { type: 'string', nullable: true },
    privateId: { type: 'string', nullable: true },
    secretKey: { type: 'string', nullable: true },
    status: { type: 'number', nullable: true },
    ignorePassword: { type: 'boolean', nullable: true }
  },
  required: [],
  additionalProperties: false // Disallow properties not defined in the schema
}

export const EditUserProfileSchema: JSONSchemaType<EditUserProfileParams> = {
  type: 'object',
  properties: {
    fullname: { type: 'string', nullable: true },
    phoneNumber: { type: 'string', nullable: true },
    email: { type: 'string', nullable: true },
    avatar: { type: 'string', nullable: true },
    internalWallet: { type: 'number', nullable: true },
    reward: { type: 'number', nullable: true },
    gender: { type: 'number', nullable: true },
    dob: {
      type: 'string',
      pattern: '^(\\d{2})/(\\d{2})/(\\d{4})$',
      nullable: true
    }
  },
  additionalProperties: false
}

export const EditUserPortalProfileSchema: JSONSchemaType<EditUserPortalProfileParams> = {
  type: 'object',
  properties: {
    fullname: { type: 'string', nullable: true },
    phoneNumber: { type: 'string', nullable: true },
    email: { type: 'string', nullable: true },
    avatar: { type: 'string', nullable: true }
  },
  additionalProperties: false
}

export const ChangePasswordSchema: JSONSchemaType<ChangePasswordParams> = {
  type: 'object',
  properties: {
    currentPassword: { type: 'string', minLength: 8 },
    newPassword: { type: 'string', minLength: 8 },
    passwordConfirmation: { type: 'string', minLength: 8 }
  },
  required: ['currentPassword', 'newPassword', 'passwordConfirmation'],
  additionalProperties: false
}

export const RegGSaleAccountSchema: JSONSchemaType<RegGSaleAccountParams> = {
  type: 'object',
  required: ['password', 'username'],
  properties: {
    username: { type: 'string', minLength: 10, maxLength: 32 },
    password: { type: 'string', minLength: 8, maxLength: 50 },
    roleId: {
      type: 'number',
      enum: [3],
      nullable: true
    },
    phoneNumber: {
      type: 'string',
      minLength: 10,
      maxLength: 11,
      nullable: true
    },
    locale: { type: 'string', enum: ['en', 'vi'], nullable: true }
  },
  additionalProperties: false
}

export const GetAffUserByRoleSchema: JSONSchemaType<GetAffUserByRoleParams> = {
  type: 'object',
  required: ['roleCodes'],
  properties: {
    roleCodes: {
      type: 'array',
      items: {
        type: 'string',
      }
    },
  },
  additionalProperties: false
}