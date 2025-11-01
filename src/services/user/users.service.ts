import BaseService from '@core/base.service';
import { CustomError } from '@errors/custom';

// service

// model primary

// model replica
import UserReplicaModel from '@models/replica/user.model';

// interface
import { FuncResponse } from '@interfaces/response';
import { 
  UsersListParams,
  UserListItem,
  UserDetail,
  UserDetailParams,
  UserPackageStatus,
  ConnectedPage
} from '@interfaces/user';
import { Authentication } from '@interfaces/auth.interface';

export default new class UsersService extends BaseService {
  constructor() {
    super();
  }

  async getList(params: UsersListParams, auth: Authentication): Promise<FuncResponse<object>> {
    try {
      const { page, pageSize, status, roleId, search } = params;

      const queryBuilder = UserReplicaModel.query()
        .alias('u')
        .leftJoin('chatbot_user_packages as up', function () {
          this.on('u.uid', 'up.userUid')
            .andOnVal('up.isActive', '=', true);
        })
        .leftJoin('chatbot_packages as pkg', 'up.packageUid', 'pkg.uid')
        .leftJoin('chatbot_channels as ch', function () {
          this.on('u.uid', 'ch.userUid')
            .andOnVal('ch.isActive', '=', true);
        })
        .leftJoin('chatbot_facebook_pages as fp', 'ch.uid', 'fp.channelUid')
        .whereNot('u.username', auth.username);

      // Filters
      if (status) queryBuilder.where('u.status', status);
      if (roleId) queryBuilder.where('u.roleId', roleId);
      if (search) {
        queryBuilder.where(function () {
          this.where('u.username', 'ilike', `%${search}%`)
            .orWhere('u.firstName', 'ilike', `%${search}%`)
            .orWhere('u.lastName', 'ilike', `%${search}%`)
            .orWhere('u.email', 'ilike', `%${search}%`);
        });
      }

      // Execute query with aggregation
      const users = await queryBuilder
        .select(
          'u.uid',
          'u.id',
          'u.username',
          'u.firstName',
          'u.lastName',
          'u.middleName',
          'u.email',
          'u.phoneCode',
          'u.phoneNumber',
          'u.avatar',
          'u.roleId',
          'u.status',
          'u.locale',
          'u.createdAt',
          'u.updatedAt',
          'pkg.name as packageName',
          'pkg.code as packageCode',
          'up.quota as totalTokens',
          'up.usedQuota as usedTokens',
          'up.startDate as packageStartDate',
          'up.endDate as packageEndDate',
          UserReplicaModel.raw(`
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', fp.page_id,
                  'name', fp.page_name,
                  'isActive', fp.is_active
                )
              ) FILTER (WHERE fp.page_id IS NOT NULL),
              '[]'::json
            ) as "facebookPages"
          `)
        )
        .countDistinct('ch.uid as channelCount')
        .groupBy(
          'u.uid', 'u.id', 'u.username', 'u.firstName', 'u.lastName', 'u.middleName',
          'u.email', 'u.phoneCode', 'u.phoneNumber', 'u.avatar', 'u.roleId',
          'u.status', 'u.locale', 'u.createdAt', 'u.updatedAt',
          'pkg.name', 'pkg.code', 'up.quota', 'up.usedQuota',
          'up.startDate', 'up.endDate'
        )
        .orderBy('u.createdAt', 'desc')
        .page(page - 1, pageSize) as { 
          total: number,
          results: UserListItem[],
        };

      const now = this.common.moment.init();

      const results = users.results.map((user) => {
        const availableTokens = user.totalTokens && user.usedTokens
          ? user.totalTokens - user.usedTokens
          : 0;

        const packageStatus =
          user.packageEndDate && now.isBefore(this.common.moment.init(user.packageEndDate))
            ? 'active'
            : 'expired';

        const facebookPages: ConnectedPage[] = Array.isArray(user.facebookPages)
          ? user.facebookPages.filter((p: ConnectedPage) => p?.id)
          : JSON.parse(user.facebookPages || '[]');

        return {
          uid: user.uid,
          id: user.id,
          fullName: `${user.firstName?.trim() || ''} ${user.middleName?.trim() || ''} ${user.lastName?.trim() || ''}`.trim(),
          email: user.email,
          phoneNumber:
            user.phoneCode && user.phoneNumber
              ? `${user.phoneCode.trim()}${user.phoneNumber.trim()}`
              : '',
          avatar: user.avatar,
          roleId: user.roleId,
          roleName: user.roleId === 1 ? 'Admin' : 'User',
          status: user.status,
          locale: user.locale,
          packageInfo: {
            packageCode: user.packageCode || '',
            totalTokens: user.totalTokens || 0,
            usedTokens: user.usedTokens || 0,
            availableTokens,
            status: packageStatus,
            startDate: user.packageStartDate
              ? this.common.moment.init(user.packageStartDate).format('DD/MM/YYYY HH:mm')
              : null,
            endDate: user.packageEndDate
              ? this.common.moment.init(user.packageEndDate).format('DD/MM/YYYY HH:mm')
              : null,
          },
          connections: {
            totalChannels: parseInt(user.channelCount || '0'),
            facebookPages,
          },
          createdAt: this.common.moment.init(user.createdAt).format('DD/MM/YYYY HH:mm:ss'),
          updatedAt: user.updatedAt
            ? this.common.moment.init(user.updatedAt).format('DD/MM/YYYY HH:mm:ss')
            : null,
        };
      });

      return this.responseSuccess({
        total: users.total,
        page,
        pageSize,
        totalPages: Math.ceil(users.total / pageSize),
        results,
      });

    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getDetail(params: UserDetailParams): Promise<FuncResponse<object>> {
    try {
      const user = await UserReplicaModel.query()
        .alias('u')
        .leftJoin('chatbot_user_packages as up', function() {
          this.on('u.uid', 'up.userUid')
            .andOnVal('up.isActive', '=', true);
        })
        .leftJoin('chatbot_packages as pkg', 'up.packageUid', 'pkg.uid')
        .leftJoin('chatbot_channels as ch', function() {
          this.on('u.uid', 'ch.userUid')
            .andOnVal('ch.isActive', '=', true);
        })
        .leftJoin('chatbot_facebook_pages as fp', 'ch.uid', 'fp.channelUid')
        .where('u.uid', params.userUid)
        .select(
          'u.uid',
          'u.id',
          'u.username',
          'u.firstName',
          'u.lastName',
          'u.middleName',
          'u.email',
          'u.phoneCode',
          'u.phoneNumber',
          'u.avatar',
          'u.roleId',
          'u.status',
          'u.locale',
          'u.gender',
          'u.createdAt',
          'u.updatedAt',
          // Package info
          'pkg.name as packageName',
          'pkg.code as packageCode',
          'up.quota as totalTokens',
          'up.usedQuota as usedTokens',
          'up.startDate as packageStartDate',
          'up.endDate as packageEndDate',
          UserReplicaModel.raw(`
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', fp.page_id,
                  'name', fp.page_name,
                  'isActive', fp.is_active
                )
              ) FILTER (WHERE fp.page_id IS NOT NULL),
              '[]'::json
            ) as "facebookPages"
          `)
        )
        .countDistinct('ch.uid as channelCount')
        .groupBy(
          'u.uid', 'u.id', 'u.username', 'u.firstName', 'u.lastName', 'u.middleName',
          'u.email', 'u.phoneCode', 'u.phoneNumber', 'u.avatar', 'u.roleId', 
          'u.status', 'u.locale', 'u.gender', 'u.createdAt', 'u.updatedAt',
          'pkg.name', 'pkg.code', 'up.quota', 'up.usedQuota', 
          'up.startDate', 'up.endDate'
        )
        .first() as UserListItem;

      if (!user)
        throw new CustomError(this.errorCodes.NOT_FOUND);

      const availableTokens = 
        user.totalTokens && user.usedTokens 
          ? user.totalTokens - user.usedTokens 
          : 0;

      const now = this.common.moment.init();
      const packageStatus =
        user.packageEndDate && now.isBefore(this.common.moment.init(user.packageEndDate))
          ? UserPackageStatus.ACTIVE
          : UserPackageStatus.EXPIRED;

      const facebookPages: ConnectedPage[] = Array.isArray(user.facebookPages)
        ? user.facebookPages.filter((p: ConnectedPage) => p?.id)
        : JSON.parse(user.facebookPages || '[]');
        
      const result: UserDetail = {
        uid: user.uid,
        id: user.id,
        fullName: 
          `${user.firstName?.trim() || ''} ${user.middleName?.trim() || ''} ${user.lastName?.trim() || ''}`.trim(),
        email: user.email,
        phoneNumber: 
          user.phoneCode && user.phoneNumber 
            ? `${user.phoneCode.trim()}${user.phoneNumber.trim()}` 
            : null,
        avatar: user.avatar,
        roleId: user.roleId,
        roleName: user.roleId === 1 ? 'Admin' : 'User',
        status: user.status,
        locale: user.locale,
        gender: user.gender,
        packageInfo:{
          packageCode: user.packageCode || '',
          totalTokens: user.totalTokens || 0,
          usedTokens: user.usedTokens || 0,
          availableTokens: availableTokens,
          startDate: user.packageStartDate 
            ? this.common.moment.init(user.packageStartDate).format('DD/MM/YYYY HH:mm')
            : null,
          endDate: user.packageEndDate 
            ? this.common.moment.init(user.packageEndDate).format('DD/MM/YYYY HH:mm')
            : null,
          status: packageStatus,
        },
        connections: {
          totalChannels: parseInt(user.channelCount || '0'),
          facebookPages,
        },
        createdAt: this.common.moment.init(user.createdAt).format('DD/MM/YYYY HH:mm:ss'),
        updatedAt: user.updatedAt ? this.common.moment.init(user.updatedAt).format('DD/MM/YYYY HH:mm:ss') : null,
      };

      return this.responseSuccess(result);

    } catch (error: any) {
      return this.responseError(error);
    }
  }
}