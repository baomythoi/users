import BaseModel from '@core/base.model';
import Moment from '@utils/moment';
import { ModelOptions, QueryContext } from 'objection';

export default class UserModel extends BaseModel {
  static get tableName() {
    return 'chatbot_users';
  }

  $parseDatabaseJson(json: any) {
    json = super.$parseDatabaseJson(json);

    if (json.id)
      json.id = parseInt(json.id, 10);

    if (json.wallet)
      json.wallet = parseInt(json.wallet, 10);

    if (json.reward)
      json.reward = parseInt(json.reward, 10);

    if (json.internalWallet)
      json.internalWallet = parseInt(json.internalWallet, 10);

    if (json.parentId)
      json.parentId = parseInt(json.parentId, 10);

    return json;
  }

  $beforeUpdate(opt: ModelOptions, queryContext: QueryContext): Promise<any> | void {
    this.updatedDate = Moment.init().format('YYYY-MM-DD HH:mm:ss');
  }

  id!: number;
  username!: string;
  password?: string;
  roleId!: number;
  fullname!: string;
  privateId!: string;
  phoneNumber!: string;
  email!: string;
  gender!: number;
  saleLevelId!: number;
  masterMerchantId!: number;
  merchantId!: number;
  agencyId!: number;
  avatar!: string;
  referralCode!: string;
  saleWallet!: number;
  wallet!: number;
  reward!: number;
  internalWallet!: number;
  extraInfo!: Record<string, any>;
  status!: number;
  createdDate!: string;
  updatedDate!: string;

  /** optional key */
  saleLevelTitle?: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'password', 'roleId', 'saleLevelId', 'status', 'createdDate'],
      properties: {
        id: { type: 'number' },
        username: { type: 'string' },
        password: { type: 'string' },
        roleId: { type: 'number' },
        fullname: { type: 'string' },
        privateId: { type: 'string' },
        phoneNumber: { type: 'string' },
        email: { type: 'string' },
        gender: { type: 'number' },
        saleLevelId: { type: 'number' },
        masterMerchantId: { type: 'number' },
        merchantId: { type: 'number' },
        agencyId: { type: 'number' },
        avatar: { type: 'string' },
        referralCode: { type: 'string' },
        saleWallet: { type: 'number' },
        wallet: { type: 'number' },
        reward: { type: 'number' },
        internalWallet: { type: 'number' },
        extraInfo: { type: 'object' },
        status: {
          type: 'number',
          enum: [0, 1]
        },
        createdDate: { type: 'string' },
        updatedDate: { type: 'string' }
      }
    }
  }
}