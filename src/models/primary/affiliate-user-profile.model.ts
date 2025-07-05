import BaseModel from '@core/base.model';
import Moment from '@utils/moment';
import { ModelOptions, QueryContext } from 'objection';

export default class AffiliateUserProfile extends BaseModel {
  static get tableName() {
    return 'affiliate_user_profile';
  }

  static get idColumn() {
    return 'uid';
  }

  $beforeUpdate(opt: ModelOptions, queryContext: QueryContext): Promise<any> | void {
    this.updatedAt = Moment.init().format('YYYY-MM-DD HH:mm:ss');
  }

  uid!: string;
  memberArticleUid?: string; // id bai viet gioi thieu
  userId!: number;
  userCode!: string;
  participationType!: 'ban_hang' | 'gioi_thieu'; // loai hinh tham gia
  insuranceCategory!: string[]; // danh sach loai hinh bao hiem
  productCode!: string[]; // danh sach san pham bao hiem
  agentCode!: string; // ma dai ly
  certificateImages!: string[]; // danh sach hinh anh chung chi
  provinceId!: number; // ma tinh thanh
  districtId!: number; // ma quan huyen
  address!: string;
  activityAreaId!: number; // khu vuc hoat dong lay theo ma tinh thanh
  professionalExperience!: string; // kinh nghiem chuyen mon
  futureOrientation!: string; // dinh huong tuong lai
  profileImages!: string[]; // danh sach hinh anh ho so
  status!: 'Active' | 'Pending_Lock_Approval' | 'Pending_Review' | 'Locked';
  reasonForSuspension!: string; // ly do khoa tai khoan
  updatedAt!: string;
  createdAt!: string;

  /** optional key */
  avatar?: string;
  fullname?: string;
  gender?: number;
  dob?: string;
  email?: string;
  taxCode?: string;
  privateId?: string;
  privateIdInfo!: {
    title: string;
    code: 'cmndfront' | 'cmndback';
    link: string;
    type: 'png'
  }[];
  ekycStatus?: number;
  saleLevelForMerchantTitle?: string;
  activityAreaTitle?: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: [
        'userId', 'userCode', 'participationType', 'insuranceCategory', 'productCode',
        'provinceId', 'address', 'status'
      ],
      properties: {
        uid: { type: 'string' },
        memberArticleUid: { type: 'string' },
        userId: { type: 'number' },
        userCode: { type: 'string' },
        participationType: {
          type: 'string',
          enum: ['ban_hang', 'gioi_thieu']
        },
        insuranceCategory: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['nhan_tho', 'phi_nhan_tho', 'tai_chinh']
          }
        },
        productCode: { type: 'array', items: { type: 'string' } },
        agentCode: { type: 'string' },
        certificateImages: { type: 'array', items: { type: 'string' } },
        provinceId: { type: 'number' },
        districtId: { type: 'number' },
        address: { type: 'string' },
        activityAreaId: { type: 'number' },
        professionalExperience: { type: 'string' },
        futureOrientation: { type: 'string' },
        profileImages: { type: 'array', items: { type: 'string' } },
        status: {
          type: 'string',
          enum: ['Active', 'Pending_Lock_Approval', 'Pending_Review', 'Locked']
          /**
           * Active => hoat dong
           * Pending_Lock_Approval => cho duyet khoa
           * Pending_Review => cho kiem duyet
           * Locked => da khoa
           */
        },
        reasonForSuspension: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' }
      }
    }
  }
}