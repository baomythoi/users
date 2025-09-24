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

    return json;
  }

  $beforeUpdate(opt: ModelOptions, queryContext: QueryContext): Promise<any> | void {
    this.updatedAt = Moment.init().format('YYYY-MM-DD HH:mm:ss');
  }

  uid!: string;
  id!: number;
  username!: string;
  password?: string;
  roleId!: number;
  fullname!: string;
  privateId!: string;
  phoneCode!: string;
  phoneNumber!: string;
  email!: string;
  gender!: number;
  avatar!: string;
  locale!: string;
  extraInfo!: Record<string, any>;
  status!: number;
  createdAt!: string;             // Thời gian tạo bản ghi
  updatedAt!: string;             // Thời gian cập nhật bản ghi gần nhất

  /** optional key */
  saleLevelTitle?: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'password', 'roleId', 'status', 'createdAt'],
      properties: {
        uid: { type: 'string' },
        id: { type: 'number' },
        username: { type: 'string' },
        password: { type: 'string' },
        roleId: { type: 'number' },
        fullname: { type: 'string' },
        phoneCode: { type: 'string' },
        privateId: { type: 'string' },
        phoneNumber: { type: 'string' },
        email: { type: 'string' },
        gender: { type: 'number' },
        avatar: { type: 'string' },
        locale: { type: 'string' },
        extraInfo: { type: 'object' },
        status: {
          type: 'number',
          enum: [0, 1]
        },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' }
      }
    }
  }
}