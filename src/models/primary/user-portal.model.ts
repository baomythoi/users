import BaseModel from '@core/base.model';

export default class UserPortalModel extends BaseModel {
  static get tableName() {
    return 'users_portal'
  }

  static get idColumn() {
    return 'uid'
  }

  uid!: string;
  username!: string;
  password!: string;
  fullname!: string;
  phoneNumber!: string;
  email!: string;
  avatar!: string;
  roleCode!: string;
  merchantId!: number;
  agencyId!: number;
  providerId!: number;
  userId!: number;
  userIdForCommission!: number;
  extraInfo!: Record<string, any>;
  status!: number;
  lastLogin!: string;
  updatedDate!: string;
  createdDate!: string;
}