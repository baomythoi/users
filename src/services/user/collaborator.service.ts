import BaseService from '@core/base.service';
import { CustomError } from '@errors/custom';
import { resolve } from 'path';
import { createReadStream } from 'fs';
import FormData from 'form-data';

// util
import Download from '@utils/download';
import Images from '@utils/images';
import G2 from '@utils/g2';

// model primary
import UserModel from '@models/primary/user.model';
import UserEkycModel from '@models/primary/user-ekyc.model';

// model replica
import UserReplicaModel from '@models/replica/user.model';
import UserEkycReplicaModel from '@models/replica/user-ekyc.model';

// interface
import { FuncResponse } from '@interfaces/response';
import {
  FindAllParams,
  ActiveParams,
  CreateContractParams
} from '@interfaces/collaborator';
import { UserData } from '@interfaces/user';

export default new class UserCollaborators extends BaseService {
  constructor() {
    super();
  }

  async getAllDirect(params: FindAllParams): Promise<FuncResponse<UserData[]>> {
    try {
      const users = await UserReplicaModel.query()
        .withRecursive('parent', (queryBuilder) => {
          queryBuilder.select('userId AS id')
            .from('referral')
            .where('userId', params.userId)
            .unionAll((unionQueryBuilder) => {
              unionQueryBuilder.select('parentId AS id')
                .from('referral')
                .join('parent', 'parent.id', 'referral.user_id')
            })
        })
        .select(
          'user.id',
          'user.username',
          'user.phoneNumber',
          'user.email',
          'user.wallet',
          'user.reward',
          'user.internalWallet',
          'user.saleLevelId',
          'user.merchantId',
          'user.agencyId',
          'referral.parentId',
          'agency.title AS agencyTitle',
          'agency.type AS agencyType',
          'user_ekyc.ewallet',
          'user_ekyc.status AS ekycStatus'
        )
        .select(UserReplicaModel.raw(`
          COALESCE(user_ekyc.ewallet->>'fullname', "user".fullname) AS fullname,
          COALESCE(sale_level_for_merchant.title, sale_level.title) AS "saleLevelTitle",
          COALESCE("user".extra_info->>'contractNo', user_ekyc.contract_no) AS "contractNo"
        `))
        .from('parent')
        .join('user', 'parent.id', 'user.id')
        .join('referral', 'user.id', 'referral.user_id')
        .join('agency', 'user.agency_id', 'agency.id')
        .join('sale_level', 'user.sale_level_id', 'sale_level.id')
        .join(
          'sale_level_for_merchant',
          function () {
            this.on('user.sale_level_id', '=', 'sale_level_for_merchant.sale_level_id')
              .andOn('user.merchant_id', '=', 'sale_level_for_merchant.merchant_id')
              .andOn('user.agency_id', '=', 'sale_level_for_merchant.agency_id');
          }
        )
        .leftJoin('user_ekyc', 'user.username', 'user_ekyc.username')
        .modify((queryBuilder) => {
          if (params.ignoreYourself)
            queryBuilder.where('user.id', '<>', params.userId);
        })
        .where('user.merchantId', params.merchantId)

      return this.responseSuccess(users);
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  getAllUnder = async (params: FindAllParams): Promise<FuncResponse<UserData[]>> => {
    try {
      const users = await UserReplicaModel.query()
        .withRecursive('parent', (queryBuilder) => {
          queryBuilder.select('userId AS id')
            .from('referral')
            .where('parentId', params.userId)
            .unionAll((unionQueryBuilder) => {
              unionQueryBuilder.select('userId AS id')
                .from('referral')
                .join('parent', 'parent.id', 'referral.parent_id')
            })
        })
        .select(
          'user.id',
          'user.username',
          'user.avatar',
          'user.phoneNumber',
          'user.email',
          'user.wallet',
          'user.reward',
          'user.internalWallet',
          'user.saleLevelId',
          'user.merchantId',
          'user.agencyId',
          'referral.parentId',
          'agency.title AS agencyTitle',
          'agency.type AS agencyType',
          'user_ekyc.ewallet',
          'user_ekyc.status AS ekycStatus'
        )
        .select(UserReplicaModel.raw(`
          COALESCE(user_ekyc.ewallet->>'fullname', "user".fullname) AS fullname,
          COALESCE(sale_level_for_merchant.title, sale_level.title) AS "saleLevelTitle",
          COALESCE("user".extra_info->>'contractNo', user_ekyc.contract_no) AS "contractNo"
        `))
        .from('parent')
        .join('user', 'parent.id', 'user.id')
        .join('referral', 'user.id', 'referral.user_id')
        .join('agency', 'user.agency_id', 'agency.id')
        .join('sale_level', 'user.sale_level_id', 'sale_level.id')
        .join(
          'sale_level_for_merchant',
          function () {
            this.on('user.sale_level_id', '=', 'sale_level_for_merchant.sale_level_id')
              .andOn('user.merchant_id', '=', 'sale_level_for_merchant.merchant_id')
              .andOn('user.agency_id', '=', 'sale_level_for_merchant.agency_id');
          }
        )
        .leftJoin('user_ekyc', 'user.username', 'user_ekyc.username')
        .modify((queryBuilder) => {
          if (params.ignoreYourself)
            queryBuilder.where('user.id', '<>', params.userId);
        })
        .where('user.merchantId', params.merchantId)

      return this.responseSuccess(users);
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async active(params: ActiveParams): Promise<FuncResponse<object>> {
    try {
      await UserModel.transaction(async (trx) => {
        const isValidPrivateId = await UserEkycModel.query(trx)
          .where('privateId', params.privateId)
          .first();
        if (isValidPrivateId instanceof UserEkycModel)
          throw new CustomError(this.errorCodes.PRIVATE_ID_IS_CONFLICT);

        const userEkyc = await UserEkycModel.query(trx)
          .insert({
            contractNo: params.contractNo,
            userId: params.userId,
            username: params.username,
            merchantId: params.merchantId,
            agencyId: params.agencyId,
            privateId: params.privateId,
            privateIdInfo: [{
              title: 'Mặt trước',
              code: 'cmndfront',
              link: params.privateIdFrontUrl,
              type: 'png'
            }, {
              title: 'Mặt sau',
              code: 'cmndback',
              link: params.privateIdBackUrl,
              type: 'png'
            }],
            privateIdInfoStatus: 2,
            signatureInfo: [{
              title: 'Chữ ký',
              code: 'signature',
              link: params.signatureUrl,
              type: 'png'
            }],
            signatureInfoStatus: 2,
            userInfo: {
              fullname: params.fullname,
              privateId: params.privateId,
              email: params.email,
              gender: params.gender.toString(),
              dob: params.dob,
              address: params.address,
              taxCode: params.taxCode,
              paymentType: params.paymentType,
              privateIdType: params.privateIdType,
              privateIdDate: params.privateIdDate,
              privateIdPlace: params.privateIdPlace,
            },
            userInfoStatus: 2,
            ewallet: {
              fullname: params.fullname,
              code: params.ewalletCode
            },
            signDate: this.common.moment.init().format('YYYY-MM-DD HH:mm'),
            approvalDate: this.common.moment.init().format(),
            status: 2,
            createdDate: this.common.moment.init().format()
          })

        await UserModel.query(trx)
          .patch({
            fullname: params.fullname,
            email: params.email,
            gender: params.gender,
            privateId: params.privateId
          })
          .where('id', params.userId);

        this.pushToWorker({
          exchange: 'worker.service.users.exchange',
          routing: 'worker.users.create_collaborator_contract.routing',
          message: {
            params: {
              uid: userEkyc.uid
            }
          }
        })
      })

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async createContract(params: CreateContractParams): Promise<FuncResponse<object>> {
    try {
      const ekycDetail = await UserEkycReplicaModel.query()
        .where('uid', params.uid)
        .where('status', 2)
        .first();
      if (!(ekycDetail instanceof UserEkycReplicaModel))
        throw new CustomError(this.errorCodes.EKYC_PROFILE_NOT_FOUND);

      const {
        ewallet,
        signatureInfo,
        userInfo,
      } = ekycDetail;

      let PAYMENT_TYPE = 'Chuyển vào ví điện tử';
      const ACCOUNT_NAME = 'N/A';
      const ACCOUNT_NUMBER = 'N/A';
      const BANK_NAME = 'N/A';

      switch (ewallet.code) {
        case 'bank':
          PAYMENT_TYPE = 'Chuyển khoản ngân hàng';
          break;

        case 'internal_wallet':
          PAYMENT_TYPE = 'Ví Nội Bộ';
          break;
      }

      // get signature buffer
      const getSignatureBufferResult = await Download.fromUrl(signatureInfo[0].link);
      if (!getSignatureBufferResult.success || !getSignatureBufferResult.data)
        throw new CustomError(this.errorCodes.SIGNATURE_DOWNLOAD_FAIL);

      // resize image
      const signatureBase64 = await Images.resizeBase64({
        width: 120,
        imageBuffer: getSignatureBufferResult.data
      });

      let contractPath: string = resolve('src/templates/contract/word/default.docx');
      switch (ekycDetail.agencyId) {
        case 18: // affilate co mau hop dong rieng
          contractPath = resolve('src/templates/contract/word/affiliate.docx');
          break;
      }

      const dataCreatePdf = {
        PAYMENT_TYPE,
        ACCOUNT_NAME,
        ACCOUNT_NUMBER,
        BANK_NAME,
        CONTRACT_NO: ekycDetail.contractNo,
        REGTIME: this.common.moment.init(ekycDetail.signDate).format('[ngày] DD [tháng] MM [năm] YYYY'),
        PARTNER_NAME: this.common.capitalizeWords(userInfo.fullname),
        PRIVATE_ID: ekycDetail.privateId,
        PRIVATE_ID_DATE: userInfo.privateIdDate,
        DOB: userInfo.dob,
        ACCOUNT: ekycDetail.username,
        EMAIL: userInfo.email,
        PHONE_NUMBER: ekycDetail.username,
        ADDRESS: userInfo.address,
        TAX_CODE: userInfo.taxCode,
        SIGNATURE: signatureBase64,
      }

      const formData = new FormData();
      formData.append('path', `/user/${ekycDetail.username}/contract/`);
      formData.append('storage', 's3');
      formData.append('file', createReadStream(contractPath));
      formData.append('data', JSON.stringify(dataCreatePdf));

      const createContractResult = await G2.convertWordToPdf(formData);
      if (!createContractResult.success || !createContractResult.data)
        return createContractResult;

      await UserEkycModel.query()
        .patch({
          contractUrl: createContractResult.data.url
        })
        .where('uid', ekycDetail.uid);

      /** notify thong bao hop dong */
      if (userInfo.email)
        this.pushToWorker({
          exchange: 'worker.service.notification.exchange',
          routing: 'worker.notification.users.collaborator.email_contract.routing',
          message: {
            params: {
              mailTo: userInfo.email,
              merchantId: ekycDetail.merchantId,
              userId: ekycDetail.userId,
              data: {
                fullname: this.common.capitalizeWords(userInfo.fullname),
                contractUrl: createContractResult.data.url
              }
            }
          }
        })

      /** xu ly hoa hong treo truoc khi kich hoat */
      this.pushToWorker({
        exchange: 'worker.service.commission.exchange',
        routing: 'worker.commission.payout_pending.routing',
        message: {
          params: {
            userId: +ekycDetail.userId
          }
        }
      })

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }
}