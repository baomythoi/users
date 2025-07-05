import BaseModel from '@core/base.model';
import Moment from '@utils/moment';
import { ModelOptions, QueryContext } from 'objection';

export default class TrackingUserRevenue extends BaseModel {
  static get tableName() {
    return 'tracking_user_revenue';
  }

  static get idColumn() {
    return 'uid';
  }

  $beforeUpdate(opt: ModelOptions, queryContext: QueryContext): Promise<any> | void {
    this.updatedDate = Moment.init().format('YYYY-MM-DD HH:mm:ss');
  }

  uid!: string;
  userId!: number;
  revenue!: number;
  revenueGroup!: number;
  commission!: number;
  directCommission!: number;
  indirectCommission!: number;
  commissionGroup!: number;
  totalOrder!: number;
  totalOrderGroup!: number;
  totalCollaboratorsLevel1!: number;
  totalCollaborators!: number;
  status!: number;
  updatedDate!: string;
  createdDate!: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: [
        'userId'
      ],
      properties: {
        uid: { type: 'string' },
        userId: { type: 'number' },
        revenue: { type: 'number' },
        revenueGroup: { type: 'number' },
        commission: { type: 'number' },
        directCommission: { type: 'number' },
        indirectCommission: { type: 'number' },
        commissionGroup: { type: 'number' },
        totalOrder: { type: 'number' },
        totalOrderGroup: { type: 'number' },
        totalCollaboratorsLevel1: { type: 'number' },
        totalCollaborators: { type: 'number' },
        status: { type: 'number' },
        updatedDate: { type: 'string' },
        createdDate: { type: 'string' }
      }
    }
  }
}