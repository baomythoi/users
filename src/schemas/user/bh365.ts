import { JSONSchemaType } from 'ajv';
import { BH365CreateUserParams } from '@interfaces/user';

export const BH365CreateUserSchema: JSONSchemaType<BH365CreateUserParams> = {
  type: 'object',
  properties: {
    usr: { type: 'string' },
    pwd: { type: 'string' },
    fullname: { type: 'string' },
    privateId: { type: 'string', nullable: true },
    email: { type: 'string', nullable: true },
    address: { type: 'string', nullable: true }
  },
  required: ['usr', 'pwd', 'fullname'],
  additionalProperties: false
}