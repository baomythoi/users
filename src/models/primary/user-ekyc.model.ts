import BaseModel from '@core/base.model';
import Moment from '@utils/moment';
import { ModelOptions, QueryContext } from 'objection';

export default class userEkyc extends BaseModel {
  static get tableName() {
    return 'user_ekyc';
  }

  $beforeUpdate(opt: ModelOptions, queryContext: QueryContext): Promise<any> | void {
    this.updatedDate = Moment.init().format('YYYY-MM-DD HH:mm:ss');
  }

  static get idColumn() {
    return 'uid';
  }

  uid!: string;
  contractNo!: string;
  contractUrl!: string;
  userId!: number;
  username!: string;
  merchantId!: number;
  agencyId!: number;
  privateId!: string;
  privateIdInfo!: {
    title: string;
    code: 'cmndfront' | 'cmndback';
    link: string;
    type: 'png'
  }[];
  privateIdInfoStatus!: number;
  signatureInfo!: {
    title: string;
    code: 'signature';
    link: string;
    type: 'png'
  }[];
  signatureInfoStatus!: number;
  userInfo!: {
    fullname: string;
    privateId: string;
    email: string;
    gender: string;
    dob: string;
    address: string;
    taxCode?: string;
    paymentType: number;
    bankInfo?: {
      accountName: string;
      accountNumber: string;
      bankCode: string;
      bankName: string;
      branchName: string;
    };
    privateIdType: string;
    privateIdDate: string;
    privateIdPlace: string;
  };
  userInfoStatus!: number;
  reason!: string;
  userHandleId!: number;
  ewallet!: {
    fullname: string;
    code: 'internal_wallet' | 'payme' | 'bank';
  };
  ewalletStatus!: number;
  ewalletActiveDate!: string;
  status!: number;
  approvalDate!: string;
  signDate!: string;
  updatedDate!: string;
  createdDate!: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: [
        'contractNo', 'userId', 'username', 'merchantId', 'agencyId', 'privateId',
        'privateIdInfo', 'signatureInfo', 'userInfo', 'ewallet'
      ],
      properties: {
        uid: { type: 'string' },
        contractNo: { type: 'string' },
        contractUrl: { type: 'string' },
        userId: { type: 'number' },
        username: { type: 'string' },
        merchantId: { type: 'number' },
        agencyId: { type: 'number' },
        privateId: { type: 'string' },
        privateIdInfo: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'code', 'link', 'type'],
            properties: {
              title: { type: 'string' },
              code: {
                type: 'string',
                enum: ['cmndfront', 'cmndback'],
              },
              link: { type: 'string' },
              type: {
                type: 'string',
                enum: ['png']
              }
            }
          }
        },
        privateIdInfoStatus: {
          type: 'number',
          enum: [1, 2, 3]
          /**
           * 1 => cho duyet 
           * 2 => duyet 
           * 3 => tu choi
           */
        },
        signatureInfo: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'code', 'link', 'type'],
            properties: {
              title: { type: 'string' },
              code: {
                type: 'string',
                enum: ['signature'],
              },
              link: { type: 'string' },
              type: {
                type: 'string',
                enum: ['png']
              }
            }
          }
        },
        signatureInfoStatus: {
          type: 'number',
          enum: [1, 2, 3]
          /**
           * 1 => cho duyet 
           * 2 => duyet 
           * 3 => tu choi
           */
        },
        userInfo: {
          type: 'object',
          required: [
            'fullname', 'privateId', 'email', 'gender', 'dob', 'address', 'paymentType', 'privateIdType',
            'privateIdDate', 'privateIdPlace'
          ],
          properties: {
            fullname: { type: 'string' },
            privateId: { type: 'string' },
            privateIdPlace: { type: 'string' },
            privateIdType: { type: 'string' },
            privateIdDate: { type: 'string' },
            email: { type: 'string' },
            gender: { type: 'string', enum: ['1', '2'] },
            dob: { type: 'string' },
            address: { type: 'string' },
            taxCode: { type: 'string' },
            paymentType: { type: 'number', enum: [1, 2] }, // 1 => vi dien tu, 2 => chuyen khoan
            bankInfo: {
              type: 'object',
              required: ['accountName', 'accountNumber', 'bankCode'],
              properties: {
                accountName: { type: 'string' },
                accountNumber: { type: 'string' },
                bankCode: { type: 'string' },
                bankName: { type: 'string' },
                branchName: { type: 'string' }
              }
            }
          }
        },
        userInfoStatus: {
          type: 'number',
          enum: [1, 2, 3]
          /**
           * 1 => cho duyet
           * 2 => duyet 
           * 3 => tu choi
           */
        },
        reason: { type: 'string' },
        userHandleId: { type: 'number' },
        ewallet: {
          type: 'object',
          required: ['fullname', 'code'],
          properties: {
            fullname: { type: 'string' },
            code: {
              type: 'string',
              enum: ['internal_wallet', 'payme']
            }
          }
        },
        ewalletStatus: {
          type: 'number',
          enum: [0, 1, 2, 3]
          /**
           * 0 => chua kich hoat
           * 1 => link thanh cong danh cho vi payme
           * 2 => kich hoat loi
           * 3 => kich hoat thanh cong
           */
        },
        ewalletActiveDate: { type: 'string' },
        status: {
          type: 'number',
          enum: [1, 2, 3]
          /**
           * 1 => cho phe duyet
           * 2 => da phe duyet
           * 3 => phe duyet khong dat
           */
        },
        approvalDate: { type: 'string' },
        signDate: { type: 'string' },
        updatedDate: { type: 'string' },
        createdDate: { type: 'string' }
      }
    }
  }
}