import BaseModel from '@core/base.model';

export default class SaleLevelForMerchantModel extends BaseModel {
  static get tableName() {
    return 'sale_level_for_merchant';
  }

  static get idColumn() {
    return 'uid';
  }

  uid!: string;
  merchantId!: number;
  agencyId!: number;
  saleLevelId!: number;
  title!: string;
  status!: number;
  createdDate!: string;
}