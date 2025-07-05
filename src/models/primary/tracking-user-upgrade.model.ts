import BaseModel from '@core/base.model';
import { IBasicUser } from '@interfaces/user';

export default class CacheUserUpgradeModel extends BaseModel {
  static get tableName() {
    return 'tracking_user_upgrade';
  }

  static get idColumn() {
    return 'uid';
  }

  uid!: string;
  userId!: number;
  user!: IBasicUser;
  currentParentId?: number;
  currentParent?: IBasicUser;
  newParentId?: number;
  newParent?: IBasicUser;
  currentSaleLevel!: number;
  nextSaleLevel!: number;
  data!: {
    totalRevenue: number;
  }; // du lieu set duyet len cap
  verify!: {
    statusCode: number;
    message: string;
  }; // thong tin kiem duyet
  process!: {
    statusCode: number;
    message: string;
  }; // thong tin thuc hien
  changeParent!: {
    statusCode: number;
    message: string;
  }; // thong tin cap nhat user cha
  changeParentStatus?: number;
  status?: number;
  createdDate!: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: [
        'userId',
        'user',
        'currentSaleLevel',
        'nextSaleLevel',
        'data',
        'verify',
        'process',
      ],
      properties: {
        uid: { type: 'string', format: 'uuid' },
        userId: { type: 'integer' },
        user: {
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
        },
        currentParentId: { type: ['integer', 'null'] },
        currentParent: { type: ['object', 'null'] },
        newParentId: { type: ['integer', 'null'] },
        newParent: {
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
        },
        currentSaleLevel: { type: 'integer' },
        nextSaleLevel: { type: 'integer' },
        data: {
          type: 'object',
          required: ['totalRevenue'],
          properties: {
            totalRevenue: { type: 'number' }
          }
        },
        verify: {
          type: 'object',
          required: ['statusCode', 'message'],
          properties: {
            statusCode: { type: 'number' },
            message: { type: 'string' }
          }
        },
        process: {
          type: 'object',
          required: ['statusCode', 'message'],
          properties: {
            statusCode: { type: 'number' },
            message: { type: 'string' }
          }
        },
        changeParent: {
          type: 'object',
          required: ['statusCode', 'message'],
          properties: {
            statusCode: { type: 'number' },
            message: { type: 'string' }
          }
        },
        changeParentStatus: {
          type: 'integer',
          default: 1
          /**
           * 1-khong thay doi cha
           * 2-loi thay doi user cha
           * 3-thay doi user cha thanh cong
           */
        },
        status: {
          type: 'integer',
          enum: [1, 2]
          /**
           * 1- du dien kien len cap
           * 2- khong du dieu kien len cap
           */
        },
        createdDate: { type: 'string', format: 'date-time' },
      },
    };
  }
}