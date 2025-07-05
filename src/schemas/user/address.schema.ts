import { JSONSchemaType } from 'ajv';

import {
  GetProvincesParams,
  GetDistrictsParams
} from '@interfaces/user';

export const GetProvincesSchema: JSONSchemaType<GetProvincesParams> = {
  type: 'object',
  required: [],
  properties: {
    provinceId: { type: 'number', nullable: true },
    title: { type: 'string', nullable: true }
  },
  additionalProperties: false
}

export const GetDistrictsSchema: JSONSchemaType<GetDistrictsParams> = {
  type: 'object',
  required: [],
  properties: {
    provinceId: { type: 'number', nullable: true },
    districtId: { type: 'number', nullable: true },
    title: { type: 'string', nullable: true }
  },
  additionalProperties: false
}