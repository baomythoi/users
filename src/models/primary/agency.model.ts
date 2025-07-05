import BaseModel from '@core/base.model';

export default class AgencyModel extends BaseModel {
  static get tableName() {
    return 'agency';
  }

  id!: number;
  title!: string;
  merchantId!: number;
  masterAgencyId!: number;
  type!: number;
  status!: number;
  createdDate!: string;
}