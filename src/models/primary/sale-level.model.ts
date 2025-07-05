import BaseModel from '@core/base.model';

export default class SaleLevelModel extends BaseModel {
  static get tableName() {
    return 'sale_level';
  }

  id!: number;
  title!: string;
  description!: string;
  status!: number;
  createdDate!: string;
}