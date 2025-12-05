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
  ConnectedPage,
  UserStatus
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
        .leftJoin('chatbot_channels as ch', function () {
          this.on('u.uid', 'ch.userUid')
            .andOnVal('ch.isActive', '=', true);
        })
        .leftJoin('chatbot_facebook_pages as fp', 'ch.uid', 'fp.channelUid')
        .leftJoin('chatbot_zalo_oas as zo', 'ch.uid', 'zo.channelUid')
        .whereNot('u.username', auth.username);

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
          `),
          UserReplicaModel.raw(`
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', zo.oa_id,
                  'name', zo.name,
                  'isActive', zo.is_active
                )
              ) FILTER (WHERE zo.oa_id IS NOT NULL),
              '[]'::json
            ) as "zaloOAs"
          `)
        )
        .countDistinct('ch.uid as channelCount')
        .groupBy(
          'u.uid', 'u.id', 'u.username', 'u.firstName', 'u.lastName', 'u.middleName',
          'u.email', 'u.phoneCode', 'u.phoneNumber', 'u.avatar', 'u.roleId',
          'u.status', 'u.locale', 'u.createdAt', 'u.updatedAt'
        )
        .orderBy('u.createdAt', 'desc')
        .page(page - 1, pageSize) as {
          total: number;
          results: UserListItem[];
        };

      const userDataList = await Promise.all(
        users.results.map(async (user) => {
          const [userPackageRes, tokenStatsRes] = await Promise.all([
            this.postMessages({
              exchange: 'rpc.service.chatbot.exchange',
              routing: 'rpc.chatbot.user.account.get_user_package.routing',
              message: { authentication: { username: user.username } },
            }),
            this.postMessages({
              exchange: 'rpc.service.chatbot.exchange',
              routing: 'rpc.chatbot.user.account.get_user_token_stats.routing',
              message: { authentication: { username: user.username } },
            }),
          ]);

          const packageData = userPackageRes?.data || {};
          const tokenData = tokenStatsRes?.data || {};

          const totalTokens = tokenData?.totalTokens || packageData?.quota || 0;
          const usedTokens = tokenData?.usedTokens || 0;
          const availableTokens = tokenData?.availableTokens || 0;

          const startDate = packageData?.startDate || null;
          const endDate = packageData?.endDate || null;

          const now = this.common.moment.init();
          const end = this.common.moment.init(endDate, 'HH:mm DD/MM/YYYY');
          const packageStatus = end.isValid() && now.isBefore(end)
            ? UserPackageStatus.ACTIVE
            : UserPackageStatus.EXPIRED;

          const facebookPages: ConnectedPage[] = Array.isArray(user.facebookPages)
            ? user.facebookPages.filter((p: ConnectedPage) => p?.id)
            : JSON.parse(user.facebookPages || '[]');

          const zaloOAs: ConnectedPage[] = Array.isArray(user.zaloOAs)
            ? user.zaloOAs.filter((p: ConnectedPage) => p?.id)
            : JSON.parse(user.zaloOAs || '[]');

          return {
            uid: user.uid,
            id: user.id,
            fullName: `${user.firstName?.trim() || ''} ${user.middleName?.trim() || ''} ${user.lastName?.trim() || ''}`.trim(),
            email: user.email,
            phoneNumber:
              user.phoneCode && user.phoneNumber
                ? `+${user.phoneCode.trim()} ${user.phoneNumber.trim()}`
                : null,
            avatar: user.avatar,
            roleId: user.roleId,
            roleName: user.roleId === 1 ? 'Admin' : 'User',
            status: user.status,
            locale: user.locale,
            packageInfo: {
              packageCode: packageData?.packageCode || '',
              totalTokens,
              usedTokens,
              availableTokens,
              startDate: startDate || '',
              endDate: endDate || '',
              status: packageStatus,
            },
            connections: {
              totalChannels: parseInt(user.channelCount || '0'),
              facebookPages,
              zaloOAs,
            },
            createdAt: this.common.moment.init(user.createdAt).format('DD/MM/YYYY HH:mm:ss'),
            updatedAt: user.updatedAt
              ? this.common.moment.init(user.updatedAt).format('DD/MM/YYYY HH:mm:ss')
              : null,
          };
        })
      );

      // Lọc bỏ các user lỗi RPC
      let results = userDataList.filter(Boolean);

      if (params.packageCode) {
        results = results.filter(
          (user) => user.packageInfo.packageCode === params.packageCode
        );
      }

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
        .leftJoin('chatbot_channels as ch', function() {
          this.on('u.uid', 'ch.userUid')
            .andOnVal('ch.isActive', '=', true);
        })
        .leftJoin('chatbot_facebook_pages as fp', 'ch.uid', 'fp.channelUid')
        .leftJoin('chatbot_zalo_oas as zo', 'ch.uid', 'zo.channelUid')
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
          `),
          UserReplicaModel.raw(`
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', zo.oa_id,
                  'name', zo.name,
                  'isActive', zo.is_active
                )
              ) FILTER (WHERE zo.oa_id IS NOT NULL),
              '[]'::json
            ) as "zaloOAs"
          `)
        )
        .countDistinct('ch.uid as channelCount')
        .groupBy(
          'u.uid', 'u.id', 'u.username', 'u.firstName', 'u.lastName', 'u.middleName',
          'u.email', 'u.phoneCode', 'u.phoneNumber', 'u.avatar', 'u.roleId',
          'u.status', 'u.locale', 'u.gender', 'u.createdAt', 'u.updatedAt'
        )
        .first() as UserListItem;

      if (!user) 
        throw new CustomError(this.errorCodes.NOT_FOUND);

      const [userPackageRes, tokenStatsRes] = await Promise.all([
        this.postMessages({
          exchange: 'rpc.service.chatbot.exchange',
          routing: 'rpc.chatbot.user.account.get_user_package.routing',
          message: {
            authentication: { username: user.username },
          },
        }),
        this.postMessages({
          exchange: 'rpc.service.chatbot.exchange',
          routing: 'rpc.chatbot.user.account.get_user_token_stats.routing',
          message: {
            authentication: { username: user.username },
          },
        }),
      ]);

      const packageData = userPackageRes.data;
      const tokenData = tokenStatsRes.data;

      const totalTokens = tokenData?.totalTokens || packageData?.quota || 0;
      const usedTokens = tokenData?.usedTokens || 0;
      const availableTokens = tokenData?.availableTokens || 0;

      const startDate = packageData?.startDate || null;
      const endDate = packageData?.endDate || null;

      const now = this.common.moment.init();
      const end = this.common.moment.init(endDate, 'HH:mm DD/MM/YYYY');
      const packageStatus = end.isValid() && now.isBefore(end)
        ? UserPackageStatus.ACTIVE
        : UserPackageStatus.EXPIRED;

      const facebookPages: ConnectedPage[] = Array.isArray(user.facebookPages)
        ? user.facebookPages.filter((p: ConnectedPage) => p?.id)
        : JSON.parse(user.facebookPages || '[]');

      const zaloOAs: ConnectedPage[] = Array.isArray(user.zaloOAs)
        ? user.zaloOAs.filter((p: ConnectedPage) => p?.id)
        : JSON.parse(user.zaloOAs || '[]');

      const detail: UserDetail = {
        uid: user.uid,
        id: user.id,
        fullName: `${user.firstName?.trim() || ''} ${user.middleName?.trim() || ''} ${user.lastName?.trim() || ''}`.trim(),
        email: user.email,
        phoneNumber:
          user.phoneCode && user.phoneNumber
            ? `+${user.phoneCode.trim()} ${user.phoneNumber.trim()}`
            : null,
        avatar: user.avatar,
        roleId: user.roleId,
        roleName: user.roleId === 1 ? 'Admin' : 'User',
        status: user.status,
        statusName: UserStatus[user.status],
        locale: user.locale,
        gender: user.gender,
        packageInfo: {
          packageCode: packageData?.packageCode || '',
          totalTokens,
          usedTokens,
          availableTokens,
          startDate: startDate || '',
          endDate: endDate || '',
          status: packageStatus,
        },
        connections: {
          totalChannels: parseInt(user.channelCount || '0'),
          facebookPages,
          zaloOAs,
        },
        createdAt: this.common.moment.init(user.createdAt).format('DD/MM/YYYY HH:mm:ss'),
        updatedAt: user.updatedAt
          ? this.common.moment.init(user.updatedAt).format('DD/MM/YYYY HH:mm:ss')
          : null,
      };

      return this.responseSuccess(detail);
    } catch (error: any) {
      return this.responseError(error);
    }
  }
}