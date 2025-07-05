import BaseModel from '@core/base.model';

export default class Province extends BaseModel {
  static get tableName() {
    return 'province';
  }

  id!: number;
  title!: string;
  status!: number;

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['title', 'status'],
      properties: {
        id: { type: 'number' },
        title: { type: 'string' },
        status: {
          type: 'number',
          enum: [0, 1]
        }
      }
    }
  }
}