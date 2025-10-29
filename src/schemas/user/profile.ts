import { JSONSchemaType } from 'ajv';
import {
  ProfileParams,
  EditUserProfileParams,
  EditUserPortalProfileParams,
  ChangePasswordParams,
  RegGSaleAccountParams,
  GetAffUserByRoleParams,
  ActiveUserParams,
  ChangeUserPasswordParams,
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
  required: [],
  properties: {
    phoneCode: { type: 'string', nullable: true },
    phoneNumber: { type: 'string', minLength: 8, maxLength: 10, nullable: true },
    firstName: { type: 'string', minLength: 1, maxLength: 255, nullable: true },
    lastName: { type: 'string', minLength: 1, maxLength: 255, nullable: true },
    middleName: { type: 'string', minLength: 1, maxLength: 255, nullable: true },
    avatar: { type: 'string', minLength: 1, nullable: true },
    gender: { type: 'string', enum: ['M', 'F'], nullable: true },
    locale: { type: 'string', minLength: 2, maxLength: 10, nullable: true },
    password: { type: 'string', minLength: 8, maxLength: 50, nullable: true },
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
  required: [
    'password', 
    'username', 
    'phoneCode', 
    'phoneNumber',
    'firstName',
    'lastName', 
    'locale',
  ],
  properties: {
    username: { type: 'string', minLength: 10, maxLength: 32 },
    password: { type: 'string', minLength: 8, maxLength: 50 },
    roleId: {
      type: 'number',
      enum: [1, 3],
      nullable: true
    },
    phoneNumber: {
      type: 'string',
      minLength: 8,
      maxLength: 11,
    },
    locale: { type: 'string', enum: ['en', 'vi'] },
    firstName: { type: 'string', minLength: 1, maxLength: 255 },
    lastName: { type: 'string', minLength: 1, maxLength: 255 },
    middleName: { type: 'string', minLength: 1, maxLength: 255, nullable: true },
    phoneCode: { type: 'string', minLength: 1, maxLength: 5 },
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

export const ActiveUserSchema: JSONSchemaType<ActiveUserParams> = {
  type: 'object',
  required: ['username'],
  properties: {
    username: { type: 'string', minLength: 3 },
  },
  additionalProperties: false
}

export const ChangeUserPasswordSchema: JSONSchemaType<ChangeUserPasswordParams> = {
  type: 'object',
  required: ['username', 'newPassword'],
  properties: {
    username: { type: 'string',  minLength: 10 },
    newPassword: { type: 'string', minLength: 8 },
  },
  additionalProperties: false
}
