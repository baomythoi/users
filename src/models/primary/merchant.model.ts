import BaseModel from '@core/base.model';

export default class SaleLevelModel extends BaseModel {
  static get tableName() {
    return 'sale_level';
  }

  id!: number;
  code!: string;
  title!: string;
  description!: string;
  paymentType!: number;
  extraInfo!: Record<string, any>;
  status!: number;
  createdDate!: string;
}