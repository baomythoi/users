import BaseModel from '@core/base.model';
import Moment from '@utils/moment';
import { ModelOptions, QueryContext } from 'objection';

interface IBasicUser {
  id: number;
  username: string;
  fullname: string;
  saleLevelId: number;
  merchantId: number;
  agencyId: number;
}

export default class CacheUserUpgradeModel extends BaseModel {
  static get tableName() {
    return 'tracking_cache_user_upgrade';
  }

  static get idColumn() {
    return 'uid';
  }

  $beforeUpdate(opt: ModelOptions, queryContext: QueryContext): Promise<any> | void {
    this.updatedDate = Moment.init().format('YYYY-MM-DD HH:mm:ss');
  }

  uid!: string;
  userId!: number;
  user!: IBasicUser;
  listUserParent!: IBasicUser[];
  listUserChild!: IBasicUser[];
  status!: number;
  updatedDate!: string | null;
  createdDate!: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'user', 'listUserParent', 'listUserChild'],
      properties: {
        uid: { type: 'string', format: 'uuid' },
        userId: { type: 'integer' },
        user: { type: 'object' },
        listUserParent: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'username', 'fullname', 'saleLevelId', 'merchantId', 'agencyId'],
            properties: {
              id: { type: 'number' },
              username: { type: 'string' },
              fullname: { type: 'string' },
              saleLevelId: { type: 'number' },
              merchantId: { type: 'number' },
              agencyId: { type: 'number' },
            }
          }
        },
        listUserChild: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'username', 'fullname', 'saleLevelId', 'merchantId', 'agencyId'],
            properties: {
              id: { type: 'number' },
              username: { type: 'string' },
              fullname: { type: 'string' },
              saleLevelId: { type: 'number' },
              merchantId: { type: 'number' },
              agencyId: { type: 'number' },
            }
          }
        },
        status: {
          type: 'integer',
          default: 1
        },
        updatedDate: { type: ['string', 'null'], format: 'date' },
        createdDate: { type: 'string', format: 'date-time' },
      },
    };
  }
}