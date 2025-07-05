import { JSONSchemaType } from 'ajv';
import {
  FindAllParams,
  ActiveParams
} from '@interfaces/collaborator';

export const FindAllSchema: JSONSchemaType<FindAllParams> = {
  type: 'object',
  properties: {
    userId: { type: 'number' },
    merchantId: { type: 'number' },
    ignoreYourself: { type: 'boolean', nullable: true }
  },
  required: ['userId', 'merchantId'],
  additionalProperties: false
}

export const ActiveSchema: JSONSchemaType<ActiveParams> = {
  type: 'object',
  required: ['address', 'contractNo', 'dob', 'email', 'fullname', 'gender', 'privateId', 'privateIdBackUrl',
    'privateIdDate', 'privateIdFrontUrl', 'signatureUrl', 'taxCode', 'agencyId', 'merchantId',
    'userId', 'username', 'paymentType', 'privateIdPlace', 'ewalletCode', 'privateIdType'
  ],
  properties: {
    address: { type: 'string' },
    contractNo: {
      type: 'string',
      minLength: 10,
      maxLength: 50
    },
    dob: {
      type: 'string',
      pattern: '^(\\d{2})/(\\d{2})/(\\d{4})$',
    },
    email: {
      type: 'string',
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      minLength: 10
    },
    fullname: { type: 'string' },
    gender: {
      type: 'number',
      enum: [1, 2]
    },
    privateId: { type: 'string', minLength: 8, maxLength: 20 },
    privateIdType: { type: 'string', maxLength: 20 },
    privateIdPlace: { type: 'string' },
    privateIdBackUrl: { type: 'string', maxLength: 200 },
    privateIdDate: {
      type: 'string',
      pattern: '^(\\d{2})/(\\d{2})/(\\d{4})$',
    },
    privateIdFrontUrl: { type: 'string', maxLength: 200 },
    signatureUrl: { type: 'string', maxLength: 200 },
    taxCode: { type: 'string', minLength: 5 },
    userId: { type: 'number' },
    username: { type: 'string' },
    merchantId: { type: 'number' },
    agencyId: { type: 'number' },
    paymentType: { type: 'number', enum: [1, 2] },
    ewalletCode: {
      type: 'string',
      enum: ['internal_wallet', 'payme']
    }
  },
  additionalProperties: false
}