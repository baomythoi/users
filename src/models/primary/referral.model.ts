import BaseModel from '@core/base.model';

export default class ReferralModel extends BaseModel {
  static get tableName() {
    return 'referral';
  }

  id!: number;
  parentId!: number;
  userId!: number;
  status!: number;
  createdDate!: string;

  /** optional key */
  saleLevelId?: number;
}