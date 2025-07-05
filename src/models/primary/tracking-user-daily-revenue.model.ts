import BaseModel from '@core/base.model';
import Moment from '@utils/moment';
import { ModelOptions, QueryContext } from 'objection';

export default class UserDailyRevenueModel extends BaseModel {
  static get tableName() {
    return 'tracking_user_daily_revenue';
  }

  $parseDatabaseJson(json: any) {
    json = super.$parseDatabaseJson(json);

    if (json.userId)
      json.userId = parseInt(json.userId, 10);

    if (json.totalCollaboratorsLevel1)
      json.totalCollaboratorsLevel1 = parseInt(json.totalCollaboratorsLevel1, 10);

    if (json.totalCollaborators)
      json.totalCollaborators = parseInt(json.totalCollaborators, 10);

    return json;
  }

  $beforeUpdate(opt: ModelOptions, queryContext: QueryContext): Promise<any> | void {
    this.updatedAt = Moment.init().format('YYYY-MM-DD HH:mm:ss');
  }

  uid!: string;
  userId!: number;
  date!: string;
  revenue?: number;
  revenueGroup?: number;
  commission?: number;
  directCommission?: number;
  indirectCommission?: number;
  commissionGroup?: number;
  totalOrder?: number;
  totalOrderGroup?: number;
  totalCollaboratorsLevel1?: number;
  totalCollaborators?: number;
  status!: 'Active' | 'InActive';
  createdAt?: string;
  updatedAt?: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'date'],
      properties: {
        uid: { type: 'string', format: 'uuid' },
        userId: { type: 'integer' },
        date: { type: 'string', format: 'date' },
        revenue: { type: 'number', default: 0 },
        revenueGroup: { type: 'number', default: 0 },
        commission: { type: 'number', default: 0 },
        directCommission: { type: 'number', default: 0 },
        indirectCommission: { type: 'number', default: 0 },
        commissionGroup: { type: 'number', default: 0 },
        totalOrder: { type: 'number', default: 0 },
        totalOrderGroup: { type: 'number', default: 0 },
        totalCollaboratorsLevel1: { type: 'integer', default: 0 },
        totalCollaborators: { type: 'integer', default: 0 },
        status: {
          type: 'string',
          default: 'Active',
          enum: ['Active', 'InActive']
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    };
  }
}