import BaseModel from '@core/base.model';

export default class District extends BaseModel {
  static get tableName() {
    return 'district';
  }

  id!: number;
  provinceId!: number;
  title!: string;
  status!: number;

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['provinceId', 'title', 'status'],
      properties: {
        id: { type: 'number' },
        provinceId: { type: 'number' },
        title: { type: 'string' },
        status: {
          type: 'number',
          enum: [0, 1]
        }
      }
    }
  }
}