import BaseService from '@core/base.service';
import BaseCommon from '@core/base.common';

// repository
import UserRepository from '@repositories/user.repository';

// interface
import { FuncResponse } from '@interfaces/response';
import { 
  GetTotalUsersParams,
  GetUsersCountByPackageParams,
  GetUsersGrowthByMonthParams
} from '@interfaces/statistics.interface';

class StatisticService extends BaseService {
  constructor() {
    super();
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

  async getLatestUsers(): Promise<FuncResponse<object>> {
    try {
      const users = await UserRepository.getLatestUsers(10);

      const results = users.map(user => ({
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
        status: user.status,
        locale: user.locale,
        createdAt: BaseCommon.moment.init(user.createdAt).format('DD/MM/YYYY HH:mm:ss'),
        updatedAt: user.updatedAt
          ? BaseCommon.moment.init(user.updatedAt).format('DD/MM/YYYY HH:mm:ss')
          : null,
      }));

      return this.responseSuccess({ results });
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getTopUsersExpiringSoon(): Promise<FuncResponse<object>> {
    try {
      const users = await UserRepository.getAllUsers(1);

      const usersWithPackage = await Promise.all(
        users.map(async (user) => {
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

            // Chỉ lấy users còn hạn
            if (end.isValid() && now.isBefore(end)) {
              return {
                uid: user.uid,
                username: user.username,
                endDate: endDate,
                endDateTimestamp: end.valueOf(),
                daysLeft: end.diff(now, 'days'),
              };
            }
          }

          return null;
        })
      );

      const results = usersWithPackage
        .filter(user => user !== null)
        .sort((a, b) => (a?.endDateTimestamp || 0) - (b?.endDateTimestamp || 0))
        .slice(0, 10)
        .map(user => ({
          uid: user?.uid || '',
          username: user?.username || '',
          endDate: user?.endDate || '',
          daysLeft: user?.daysLeft || 0,
        }));

      return this.responseSuccess({ results });
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getUsersCountByPackage(params: GetUsersCountByPackageParams): Promise<FuncResponse<object>> {
    try {
      const users = await UserRepository.getAllUsers(1, params.startDate, params.endDate);

      const packagesData = await Promise.all(
        users.map(async (user) => {
          try {
            const userPackageRes = await this.postMessages({
              exchange: 'rpc.service.chatbot.exchange',
              routing: 'rpc.chatbot.user.account.get_user_package.routing',
              message: { authentication: { username: user.username } },
            });

            const packageData = userPackageRes?.data || {};
            return packageData?.packageCode || 'NO_PACKAGE';
          } catch (error) {
            return 'NO_PACKAGE';
          }
        })
      );

      // Group by packageCode and count
      const packageCounts = packagesData.reduce((acc, packageCode) => {
        acc[packageCode] = (acc[packageCode] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Format for chart
      const data = Object.entries(packageCounts).map(([packageCode, count]) => ({
        packageCode,
        count,
      }));

      return this.responseSuccess({ data });
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getUsersGrowthByMonth(params: GetUsersGrowthByMonthParams): Promise<FuncResponse<object>> {
    try {
      const startDate = params.startDate
        ? BaseCommon.moment.init(params.startDate, 'YYYY-MM-DD').format('YYYY-MM-DD')
        : BaseCommon.moment.init().subtract(6, 'months').startOf('month').format('YYYY-MM-DD');
      const endDate = params.endDate
        ? BaseCommon.moment.init(params.endDate, 'YYYY-MM-DD').format('YYYY-MM-DD')
        : BaseCommon.moment.init().endOf('month').format('YYYY-MM-DD');

      const data = await UserRepository.getUsersGrowthByMonth(startDate, endDate);

      return this.responseSuccess({ data });
    } catch (error: any) {
      return this.responseError(error);
    }
  }
}

export default new StatisticService();