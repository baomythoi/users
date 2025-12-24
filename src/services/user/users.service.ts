import BaseService from '@core/base.service';
import BaseCommon from '@core/base.common';
import { CustomError } from '@errors/custom';

// repository
import UserRepository from '@repositories/user.repository';

// interface
import { FuncResponse } from '@interfaces/response';
import { 
  UsersListParams,
  UserDetail,
  UserDetailParams,
  UserPackageStatus,
  ConnectedPage,
  UserStatus,
  GetTotalUsersParams
} from '@interfaces/user';
import { Authentication } from '@interfaces/auth.interface';

class UsersService extends BaseService {
  constructor() {
    super();
  }

  async getList(params: UsersListParams, auth: Authentication): Promise<FuncResponse<object>> {
    try {
      const users = await UserRepository.getUserList(params, auth);

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

          let packageStatus = UserPackageStatus.NONE;
          if (endDate) {
            const now = BaseCommon.moment.init();
            const end = BaseCommon.moment.init(endDate, 'HH:mm DD/MM/YYYY');
            packageStatus = end.isValid() && now.isBefore(end)
              ? UserPackageStatus.ACTIVE
              : UserPackageStatus.EXPIRED;
          }

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
            createdAt: BaseCommon.moment.init(user.createdAt).format('DD/MM/YYYY HH:mm:ss'),
            updatedAt: user.updatedAt
              ? BaseCommon.moment.init(user.updatedAt).format('DD/MM/YYYY HH:mm:ss')
              : null,
          };
        })
      );

      let results = userDataList.filter(Boolean);

      if (params.packageCode) {
        results = results.filter(
          (user) => user.packageInfo.packageCode === params.packageCode
        );
      }

      return this.responseSuccess({
        total: users.total,
        results,
      });
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getDetail(params: UserDetailParams): Promise<FuncResponse<object>> {
    try {
      const user = await UserRepository.getUserDetail(params.userUid);

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

      let packageStatus = UserPackageStatus.NONE;
      if (endDate) {
        const now = BaseCommon.moment.init();
        const end = BaseCommon.moment.init(endDate, 'HH:mm DD/MM/YYYY');
        packageStatus = end.isValid() && now.isBefore(end)
          ? UserPackageStatus.ACTIVE
          : UserPackageStatus.EXPIRED;
      }

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
        createdAt: BaseCommon.moment.init(user.createdAt).format('DD/MM/YYYY HH:mm:ss'),
        updatedAt: user.updatedAt
          ? BaseCommon.moment.init(user.updatedAt).format('DD/MM/YYYY HH:mm:ss')
          : null,
      };

      return this.responseSuccess(detail);
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getTotalUsers(params: GetTotalUsersParams): Promise<FuncResponse<object>> {
    try {
      const total = await UserRepository.getTotalUsers(params.status, params.startDate, params.endDate);
      return this.responseSuccess({ total });
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getTotalExpiredUsers(params: GetTotalUsersParams): Promise<FuncResponse<object>> {
    try {
      const total = await this.countUsersByPackageStatus(params, true);
      return this.responseSuccess({ total });
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getTotalActiveUsers(params: GetTotalUsersParams): Promise<FuncResponse<object>> {
    try {
      const total = await this.countUsersByPackageStatus(params, false);
      return this.responseSuccess({ total });
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  private async countUsersByPackageStatus(
    params: GetTotalUsersParams,
    checkExpired: boolean
  ): Promise<number> {
    const users = await UserRepository.getAllUsers(1, params.startDate, params.endDate);

    const count = await users.reduce(async (accPromise, user) => {
      const acc = await accPromise;
      
      const userPackageRes = await this.postMessages({
        exchange: 'rpc.service.chatbot.exchange',
        routing: 'rpc.chatbot.user.account.get_user_package.routing',
        message: { authentication: { username: user.username } },
      });

      const packageData = userPackageRes?.data || {};
      const endDate = packageData?.endDate;

      if (endDate) {
        const now = BaseCommon.moment.init();
        const end = BaseCommon.moment.init(endDate, 'HH:mm DD/MM/YYYY');

        if (end.isValid()) {
          const isExpired = !now.isBefore(end);
          // Nếu checkExpired = true thì đếm expired, ngược lại đếm active
          if (checkExpired === isExpired) {
            return acc + 1;
          }
        }
      }

      return acc;
    }, Promise.resolve(0));

    return count;
  }
}

export default new UsersService();