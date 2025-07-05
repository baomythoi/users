import BaseModel from '@core/base.model';
import Moment from '@utils/moment';
import { ModelOptions, QueryContext } from 'objection';

export default class UserLevelLifeCycleModel extends BaseModel {
  static get tableName() {
    return 'user_level_lifecycle';
  }

  static get idColumn() {
    return 'uid';
  }

  $parseDatabaseJson(json: any) {
    json = super.$parseDatabaseJson(json);

    if (json.userId)
      json.userId = parseInt(json.userId, 10);

    return json;
  }

  $beforeUpdate(opt: ModelOptions, queryContext: QueryContext): Promise<any> | void {
    this.updatedAt = Moment.init().format('YYYY-MM-DD HH:mm:ss');
  }

  uid!: string;
  userId!: number;
  currentLevel!: number; // level hien tai sau khi thang cap
  upgradeLevel!: number; // level trong dot len cap tiep theo
  downgradedLevel!: number; // level trong dot giam cap tiep theo
  reviewDeadlineAt!: string;
  status!: string;
  upgradeGrantedAt!: string;
  downgradedAt?: string;
  lastCheckedAt?: string;
  createdAt!: string;
  updatedAt!: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: [
        'userId',
        'reviewDeadlineAt',
      ],
      properties: {
        uid: { type: 'string', format: 'uuid' },
        userId: { type: 'integer' },
        currentLevel: { type: 'integer', minimum: 0, maximum: 255 },
        upgradeLevel: { type: 'integer', minimum: 0, maximum: 255 },
        downgradedLevel: { type: 'integer', minimum: 0, maximum: 255 },
        reviewDeadlineAt: { type: 'string', format: 'date-time' },
        status: {
          type: 'string',
          default: 'UPGRADED',
          enum: [
            'UPGRADED', // thang cap
            'PENDING_REVIEW', // cho review
            'DOWNGRADED', // ha cap
            'RETAINED' // review nhung khong thay doi cap
          ]
        },
        upgradeGrantedAt: { type: 'string', format: 'date-time' },
        downgradedAt: { type: ['string', 'null'], format: 'date-time' },
        lastCheckedAt: { type: ['string', 'null'], format: 'date-time' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' }
      }
    };
  }
}