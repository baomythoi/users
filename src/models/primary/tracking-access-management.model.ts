import BaseModel from '@core/base.model';
import Moment from '@utils/moment';
import { ModelOptions, QueryContext } from 'objection';

export default class TrackingAccessManagement extends BaseModel {
  static get tableName() {
    return 'tracking_access_management';
  }

  static get idColumn() {
    return 'uid';
  }

  uid!: string;
  userId!: number;
  userUid!: string;
  user!: Record<string, any>;
  accessTo!: string;
  accessData!: Record<string, any>;
  createdDate!: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],
      properties: {
        uid: { type: 'string' },
        userId: { type: 'number' },
        userUid: { type: 'string' },
        user: { type: 'object' },
        accessTo: { type: 'string' },
        accessData: { type: 'object' },
        createdDate: { type: 'string' }
      }
    }
  }
}