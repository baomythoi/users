import BaseService from '@core/base.service';
import { CustomError } from '@errors/custom';

// service
import TrackingAccessService from '@services/user/tracking-access.service';
import AddressService from '@services/user/address.service';

// interface
import { FuncResponse } from '@interfaces/response';
import {
  GetAffProfileParams,
  SyncAffProfileParams,
  EditAffProfileParams,
  RegisterAffProfileParams,
  GetAllUsersParams,
  AdminEditProfileParams,
  AdminGetDetailParams,
  GetUsersParams,
  GetUserParams
} from '@interfaces/user-affiliate.interface';

// model
import AffProfileModel from '@models/primary/affiliate-user-profile.model';

// model replica
import AffProfileReplicaModel from '@models/replica/affiliate-user-profile.model';
import UserReplicaModel from '@models/replica/user.model';
import UserPortalReplicaModel from '@models/replica/user-portal.model';
import TrackingRevenueReplicaModel from '@models/replica/tracking-user-revenue.model';

export default new class AffUserProfile extends BaseService {
  private maxTop = 10;
  constructor() {
    super();
  }

  async get(params: GetAffProfileParams): Promise<FuncResponse<object>> {
    try {
      const profile = await AffProfileReplicaModel.query()
        .modify((queryBuilder) => {
          if (params.uid)
            queryBuilder.where('uid', params.uid);

          if (params.userId)
            queryBuilder.where('userId', params.userId);

          if (params.userCode)
            queryBuilder.where('userCode', params.userCode);

          if (params.status)
            queryBuilder.where('status', params.status);
        })
        .first();
      if (!(profile instanceof AffProfileReplicaModel))
        throw new CustomError(this.errorCodes.AFF_PROFILE_NOT_SYNCED);

      await this.common.redis.addCache({
        key: `users:${profile.userCode}:aff-profile`,
        value: JSON.stringify(profile)
      }, 60 * 60 * 24 * 30); // hieu luc trong 30 ngay

      return this.responseSuccess(profile);
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async sync(params: SyncAffProfileParams, authentication: { username: string }): Promise<FuncResponse<object>> {
    try {
      const detail = await AffProfileReplicaModel.query()
        .findOne('userCode', authentication.username);
      if (detail instanceof AffProfileReplicaModel)
        throw new CustomError(this.errorCodes.AFF_PROFILE_SYNCED);

      const user = await UserReplicaModel.query()
        .where('username', authentication.username)
        .where('status', 1)
        .first();
      if (!(user instanceof UserReplicaModel))
        throw new CustomError(this.errorCodes.NOT_FOUND);

      await AffProfileModel.query()
        .insert({
          ...params,
          userCode: user.username,
          userId: +user.id,
          status: 'Active'
        })

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async register(params: RegisterAffProfileParams, authentication: { username: string }): Promise<FuncResponse<object>> {
    try {
      const detail = await AffProfileReplicaModel.query()
        .findOne('userCode', authentication.username);
      if (detail instanceof AffProfileReplicaModel)
        throw new CustomError(this.errorCodes.AFF_PROFILE_SYNCED);

      const user = await UserReplicaModel.query()
        .where('username', authentication.username)
        .where('status', 1)
        .first();
      if (!(user instanceof UserReplicaModel))
        throw new CustomError(this.errorCodes.NOT_FOUND);

      await AffProfileModel.query()
        .insert({
          ...params,
          userCode: user.username,
          userId: +user.id,
          status: params.agentCode ? 'Pending_Review' : 'Active'
        })

      /**
       * todo send notify cho ban phan kiem duyet neu co nhap ma dai ly
       */
      // if (params.agentCode)

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async edit(params: EditAffProfileParams, authentication: { username: string }): Promise<FuncResponse<object>> {
    try {
      const detail = await AffProfileModel.query()
        .findOne('userCode', authentication.username);
      if (!(detail instanceof AffProfileModel))
        throw new CustomError(this.errorCodes.AFF_PROFILE_NOT_SYNCED);

      await AffProfileModel.query()
        .patch(params)
        .where('userCode', authentication.username);

      // clear cache
      await this.common.redis.clearCache(`users:${authentication.username}:aff-profile`);

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async adminGetAll(params: GetAllUsersParams): Promise<FuncResponse<object>> {
    try {
      const usersResult = await AffProfileReplicaModel.query()
        .alias('aff')
        .join('user', 'aff.userCode', 'user.username')
        .join('user_ekyc', 'user.username', 'user_ekyc.username')
        .modify((queryBuilder) => {
          if (params.fromDate && params.toDate)
            queryBuilder.whereBetween('aff.createdAt', [`${params.fromDate} 00:00`, `${params.toDate} 23:59`]);

          if (params.productCode)
            queryBuilder.andWhere((inner) => {
              params.productCode?.forEach((item) => {
                inner.orWhereRaw('??::JSONB @> ?', ['aff.productCode', `"${item}"`]);
              });
            })

          if (params.participationType)
            queryBuilder.where('aff.participationType', params.participationType);

          if (params.insuranceCategory)
            queryBuilder.andWhere((inner) => {
              params.insuranceCategory?.forEach((item) => {
                inner.orWhereRaw('??::JSONB @> ?', ['aff.insuranceCategory', `"${item}"`]);
              });
            })

          if (params.phoneNumber)
            queryBuilder.where('aff.userCode', params.phoneNumber);
        })
        .select(
          'aff.*',
          'user.avatar'
        )
        .select(
          AffProfileReplicaModel.raw(`
            user_ekyc.user_info->'fullname' AS fullname
          `)
        )
        .page(params.page - 1, params.pageSize);

      const users = await Promise.all(usersResult.results.map(async (user) => {
        const insuranceCategory = user.insuranceCategory.map(item => {
          switch (item) {
            case 'nhan_tho':
              return 'Nhân thọ';

            case 'phi_nhan_tho':
              return 'Phi nhân thọ';

            case 'tai_chinh':
              return 'Tài chính';
          }
        }).join(', ');

        let participationType;
        switch (user.participationType) {
          case 'ban_hang':
            participationType = 'Bán hàng';
            break;

          case 'gioi_thieu':
            participationType = 'Giới thiệu';
            break;
        }

        let statusTitle;
        switch (user.status) {
          case 'Active':
            statusTitle = 'Đang hoạt động';
            break;

          case 'Locked':
            statusTitle = 'Đã khóa';
            break;

          case 'Pending_Lock_Approval':
            statusTitle = 'Chờ duyệt khóa';
            break;

          case 'Pending_Review':
            statusTitle = 'Chờ kiểm duyệt';
            break;
        }

        let monthlyRevenue = 0;
        let monthlyCommission = 0;
        const trackingRevenueResult = await TrackingRevenueReplicaModel.query()
          .where('userId', user.userId)
          .first();
        if (trackingRevenueResult instanceof TrackingRevenueReplicaModel) {
          monthlyRevenue = trackingRevenueResult.revenue;
          monthlyCommission = trackingRevenueResult.commission;
        }

        return {
          uid: user.uid,
          avatar: user.avatar || '',
          fullname: this.common.capitalizeWords(user.fullname?.toLowerCase() || ''),
          participationType,
          insuranceCategory,
          statusTitle,
          statusCode: user.status,
          reasonForSuspension: user.reasonForSuspension || '',
          monthlyRevenue,
          monthlyCommission
        }
      }))

      return this.responseSuccess({
        total: usersResult.total,
        results: users
      });
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async adminEdit(params: AdminEditProfileParams, authentication: { username: string }): Promise<FuncResponse<object>> {
    try {
      const detail = await AffProfileModel.query()
        .findOne('uid', params.uid);
      if (!(detail instanceof AffProfileModel))
        throw new CustomError(this.errorCodes.AFF_PROFILE_NOT_FOUND);

      await AffProfileModel.query()
        .patch(params)
        .where('uid', params.uid);

      const operator = await UserPortalReplicaModel.query()
        .where('username', authentication.username)
        .first();
      if (operator instanceof UserPortalReplicaModel) {
        let actionTitle;
        switch (params.status) {
          case 'Active':
            if (detail.status === 'Locked')
              actionTitle = 'Mở khóa tài khoản';
            else if (detail.status === 'Pending_Review')
              actionTitle = 'Duyệt tài khoản';
            break;

          case 'Locked':
            actionTitle = 'Khóa tài khoản';
            break;

          case 'Pending_Lock_Approval':
            actionTitle = 'Chờ duyệt khóa tài khoản';
            break;

          case 'Pending_Review':
            actionTitle = 'Chờ kiểm duyệt';
            break;
        }

        await TrackingAccessService.add({
          userUid: operator.uid,
          user: operator,
          accessTo: 'crm_update_affiliate_user_profile',
          accessData: {
            userId: +detail.userId,
            actionTitle,
            new: {
              status: params.status,
              reason: params.reasonForSuspension || ''
            },
            old: {
              status: detail.status,
              reason: detail.reasonForSuspension || ''
            }
          }
        })
      }

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async adminGetDetail(params: AdminGetDetailParams): Promise<FuncResponse<object>> {
    try {
      const userResult = await AffProfileReplicaModel.query()
        .alias('aff')
        .join('user', 'aff.userCode', 'user.username')
        .join('user_ekyc', 'user.username', 'user_ekyc.username')
        .select(
          'aff.*',
          'user.avatar'
        )
        .select(
          AffProfileReplicaModel.raw(`
            user_ekyc.user_info->'fullname' AS fullname,
            user_ekyc.user_info->'gender' AS gender,
            user_ekyc.user_info->'dob' AS dob,
            user_ekyc.user_info->'email' AS email,
            user_ekyc.user_info->'taxCode' AS "taxCode",
            user_ekyc.private_id AS "privateId",
            user_ekyc.private_id_info AS "privateIdInfo",
            user_ekyc.status AS "ekycStatus"
          `)
        )
        .where('aff.uid', params.uid)
        .first();
      if (!(userResult instanceof AffProfileReplicaModel))
        throw new CustomError(this.errorCodes.AFF_PROFILE_NOT_FOUND);

      const insuranceCategory = userResult.insuranceCategory.map(item => {
        switch (item) {
          case 'nhan_tho':
            return 'Nhân thọ';

          case 'phi_nhan_tho':
            return 'Phi nhân thọ';

          case 'tai_chinh':
            return 'Tài chính';
        }
      }).join(', ');

      let participationType;
      switch (userResult.participationType) {
        case 'ban_hang':
          participationType = 'Bán hàng';
          break;

        case 'gioi_thieu':
          participationType = 'Giới thiệu';
          break;
      }

      let statusTitle;
      switch (userResult.status) {
        case 'Active':
          statusTitle = 'Đang hoạt động';
          break;

        case 'Locked':
          statusTitle = 'Đã khóa';
          break;

        case 'Pending_Lock_Approval':
          statusTitle = 'Chờ duyệt khóa';
          break;

        case 'Pending_Review':
          statusTitle = 'Chờ kiểm duyệt';
          break;
      }

      const productsResult = await Promise.all(userResult.productCode.map(async (item) => {
        const productResult = await this.postMessages({
          exchange: 'rpc.service.products_hub.exchange',
          routing: 'rpc.products_hub.product.get_detail.routing',
          message: {
            params: {
              productCode: item
            }
          }
        })
        if (productResult.success && productResult.data)
          return productResult.data.title;
      }));

      let gender = 'N/A';
      if (userResult.gender) {
        if (+userResult.gender === 1)
          gender = 'Nam';
        else
          gender = 'Nữ';
      }

      let province = 'N/A';
      const provinceResult = await AddressService.getProvince({ provinceId: userResult.provinceId })
      if (provinceResult.success && provinceResult.data)
        province = provinceResult.data.title.trim();

      let district = 'N/A';
      const districtResult = await AddressService.getDistrict({ districtId: userResult.districtId });
      if (districtResult.success && districtResult.data)
        district = districtResult.data.title.trim();

      let monthlyRevenue = 0;
      let monthlyCommission = 0;
      const trackingRevenueResult = await TrackingRevenueReplicaModel.query()
        .where('userId', userResult.userId)
        .first();
      if (trackingRevenueResult instanceof TrackingRevenueReplicaModel) {
        monthlyRevenue = trackingRevenueResult.revenue;
        monthlyCommission = trackingRevenueResult.commission;
      }

      const privateIdFrontUrl = userResult.privateIdInfo.map(item => {
        if (item.code === 'cmndfront')
          return item.link;
      }).filter(item => item);

      const privateIdBackUrl = userResult.privateIdInfo.map(item => {
        if (item.code === 'cmndback')
          return item.link;
      }).filter(item => item);

      const updateHistoryResult = await TrackingAccessService.getAll({
        accessTo: 'crm_update_affiliate_user_profile',
        accessUserId: +userResult.userId
      })
      let updateHistory;
      if (updateHistoryResult.success && updateHistoryResult.data)
        updateHistory = updateHistoryResult.data.map(item => {
          return {
            title: item.accessData.actionTitle || '',
            reason: item.accessData.new.reason || '',
            operator: item.user.fullname,
            createdAt: this.common.moment.init(item.createdDate).format('HH:mm DD/MM/YYYY')
          }
        });

      const data = {
        uid: userResult.uid,
        avatar: userResult.avatar || '',
        ekycStatus: userResult.ekycStatus,
        fullname: this.common.capitalizeWords(userResult.fullname?.toLowerCase() || ''),
        gender,
        dob: userResult.dob || 'N/A',
        privateId: userResult.privateId || 'N/A',
        phoneNumber: userResult.userCode,
        email: userResult.email || 'N/A',
        province,
        district,
        address: userResult.address,
        participationType,
        insuranceCategory,
        agentCode: userResult.agentCode,
        products: productsResult.join(', '),
        taxCode: userResult.taxCode,
        statusTitle,
        statusCode: userResult.status,
        monthlyRevenue,
        monthlyCommission,
        certificateImages: userResult.certificateImages,
        privateIdFrontUrl,
        privateIdBackUrl,
        profileImages: userResult.profileImages,
        updateHistory: updateHistory || []
      }

      return this.responseSuccess(data);
    } catch (error: any) {
      return this.responseError(error);
    }
  }


  async fetchTopUsers(): Promise<FuncResponse<object>> {
    try {
      const profileResult = await AffProfileReplicaModel.query()
        .alias('affiliate_member')
        .join('user', 'affiliate_member.userId', 'user.id')
        .join('user_ekyc', 'user.username', 'user_ekyc.username')
        .join(
          'sale_level_for_merchant',
          function () {
            this.on('user.sale_level_id', '=', 'sale_level_for_merchant.sale_level_id')
              .andOn('user.merchant_id', '=', 'sale_level_for_merchant.merchant_id')
              .andOn('user.agency_id', '=', 'sale_level_for_merchant.agency_id');
          }
        )
        .leftJoin('province AS province', 'province.id', 'affiliate_member.activityAreaId')
        .select(
          AffProfileReplicaModel.raw(`
            user_ekyc.user_info->'fullname' AS fullname,
            user_ekyc.user_info->'gender' AS gender
          `)
        )
        .select(
          'affiliate_member.uid',
          'affiliate_member.professionalExperience',
          'affiliate_member.futureOrientation',
          'affiliate_member.createdAt',
          'affiliate_member.profileImages',
          'affiliate_member.activityAreaId',
          'province.title AS activityAreaTitle',
          'sale_level_for_merchant.title AS saleLevelForMerchantTitle',
        )
        .orderBy('affiliate_member.createdAt', 'DESC')
        .limit(this.maxTop);

      const profiles = profileResult.map(item => {
        let gender = 'N/A';
        if (item.gender) {
          if (+item.gender == 1)
            gender = 'Nam';
          else
            gender = 'Nữ';
        }

        return {
          uid: item.uid,
          professionalExperience: item.professionalExperience,
          futureOrientation: item.futureOrientation,
          profileImages: item.profileImages ? item.profileImages : [],
          gender,
          fullname: item.fullname ? this.common.capitalizeWords(item.fullname.toLowerCase()): 'N/A',
          saleLevelForMerchantTitle: item.saleLevelForMerchantTitle || 'N/A',
          activityAreaTitle: item.activityAreaTitle || 'N/A',
        };
      });

      return this.responseSuccess({
        total: this.maxTop,
        results: profiles
      });
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async fetchAllUsers(params: GetUsersParams): Promise<FuncResponse<object>> {
    try {
      // Lấy danh sách thành viên với phân trang
      const profileResult = await AffProfileReplicaModel.query()
        .alias('affiliate_member')
        .join('user', 'affiliate_member.userId', 'user.id')
        .join('user_ekyc', 'user.username', 'user_ekyc.username')
        .join(
          'sale_level_for_merchant',
          function () {
            this.on('user.sale_level_id', '=', 'sale_level_for_merchant.sale_level_id')
              .andOn('user.merchant_id', '=', 'sale_level_for_merchant.merchant_id')
              .andOn('user.agency_id', '=', 'sale_level_for_merchant.agency_id');
          }
        )
        .leftJoin('province AS province', 'province.id', 'affiliate_member.activityAreaId')
        .select(
          AffProfileReplicaModel.raw(`
            user_ekyc.user_info->'fullname' AS fullname,
            user_ekyc.user_info->'gender' AS gender
          `)
        )
        .select(
          'affiliate_member.uid',
          'affiliate_member.professionalExperience',
          'affiliate_member.futureOrientation',
          'affiliate_member.createdAt',
          'affiliate_member.profileImages',
          'affiliate_member.activityAreaId',
          'province.title AS activityAreaTitle',
          'sale_level_for_merchant.title AS saleLevelForMerchantTitle',
        )
        .orderBy('affiliate_member.createdAt', 'DESC')
        .page(params.page - 1, params.pageSize)

      const profiles = profileResult.results.map(item => {
        let gender = 'N/A';
        if (item.gender) {
          if (+item.gender == 1)
            gender = 'Nam';
          else
            gender = 'Nữ';
        }

        return {
          uid: item.uid,
          professionalExperience: item.professionalExperience,
          futureOrientation: item.futureOrientation,
          profileImages: item.profileImages ? item.profileImages : [],
          gender,
          fullname: item.fullname ? this.common.capitalizeWords(item.fullname.toLowerCase()): 'N/A',
          saleLevelForMerchantTitle: item.saleLevelForMerchantTitle || 'N/A',
          activityAreaTitle: item.activityAreaTitle || 'N/A',
        };
      });

      return this.responseSuccess({
        total: profileResult.total,
        results: profiles
      });
    } catch (error: any) {
      return this.responseError(error);
    }
  }


  async getOne(params: GetUserParams): Promise<FuncResponse<object>> {
    try {
      const profileResult = await AffProfileReplicaModel.query()
        .alias('affiliate_member')
        .join('user', 'affiliate_member.userId', 'user.id')
        .join('user_ekyc', 'user.username', 'user_ekyc.username')
        .join(
          'sale_level_for_merchant',
          function () {
            this.on('user.sale_level_id', '=', 'sale_level_for_merchant.sale_level_id')
              .andOn('user.merchant_id', '=', 'sale_level_for_merchant.merchant_id')
              .andOn('user.agency_id', '=', 'sale_level_for_merchant.agency_id');
          }
        )
        .leftJoin('province AS province', 'province.id', 'affiliate_member.activityAreaId')
        .where('affiliate_member.uid', params.uid)
        .select(
          AffProfileReplicaModel.raw(`
            user_ekyc.user_info->'fullname' AS fullname,
            user_ekyc.user_info->'gender' AS gender
          `)
        )
        .select(
          'affiliate_member.uid',
          'affiliate_member.professionalExperience',
          'affiliate_member.futureOrientation',
          'affiliate_member.createdAt',
          'affiliate_member.profileImages',
          'affiliate_member.activityAreaId',
          'province.title AS activityAreaTitle',
          'sale_level_for_merchant.title AS saleLevelForMerchantTitle',
        )
        .first();

      if (!(profileResult instanceof AffProfileReplicaModel))
        throw new CustomError(this.errorCodes.AFF_PROFILE_NOT_FOUND);

      let gender = 'N/A';
      if (profileResult.gender) {
        if (+profileResult.gender == 1)
          gender = 'Nam';
        else
          gender = 'Nữ';
      }

      const profile = {
        uid: profileResult.uid,
        professionalExperience: profileResult.professionalExperience,
        futureOrientation: profileResult.futureOrientation,
        profileImages: profileResult.profileImages ? profileResult.profileImages : [],
        gender,
        fullname: profileResult.fullname ? this.common.capitalizeWords(profileResult.fullname.toLowerCase()): 'N/A',
        saleLevelForMerchantTitle: profileResult.saleLevelForMerchantTitle || 'N/A',
        activityAreaTitle: profileResult.activityAreaTitle || 'N/A',
      };
      return this.responseSuccess(profile);
    } catch (error: any) {
      return this.responseError(error);
    }
  }
}