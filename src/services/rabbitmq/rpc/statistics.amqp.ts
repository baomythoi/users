import BaseCommon from '@core/base.common';

// interface
import { FuncResponse } from '@interfaces/response';
import { RequestParams } from '@interfaces/rabbitmq';

// schema
import {
  GetTotalUsersParamsSchema,
  GetUsersCountByPackageParamsSchema,
  GetUsersGrowthByMonthParamsSchema,
} from '@schemas/user/statistics.schema';

// service
import AdminStatisticService from '@services/admin/statistics.service';

class StatisticsRPCService {
  public routing = 'rpc.users.statistics.*.routing';

  async processMessage(routingKey: string, request: RequestParams): Promise<FuncResponse<object>> {
    let isValid: FuncResponse<object>;

    switch (routingKey) {
      // Admin
      case 'rpc.users.statistics.get_total.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetTotalUsersParamsSchema);
        if (!isValid.success) return isValid;
        return await AdminStatisticService.getTotalUsers(request.params);

      case 'rpc.users.statistics.get_total_expired.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetTotalUsersParamsSchema);
        if (!isValid.success) return isValid;
        return await AdminStatisticService.getTotalExpiredUsers(request.params);

      case 'rpc.users.statistics.get_total_active.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetTotalUsersParamsSchema);
        if (!isValid.success) return isValid;
        return await AdminStatisticService.getTotalActiveUsers(request.params);

      case 'rpc.users.statistics.get_top_expiring.routing':
        return await AdminStatisticService.getTopUsersExpiringSoon();

      case 'rpc.users.statistics.get_latest.routing':
        return await AdminStatisticService.getLatestUsers();

      case 'rpc.users.statistics.get_count_by_package.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetUsersCountByPackageParamsSchema);
        if (!isValid.success) return isValid;
        return await AdminStatisticService.getUsersCountByPackage(request.params);

      case 'rpc.users.statistics.get_growth_by_month.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetUsersGrowthByMonthParamsSchema);
        if (!isValid.success) return isValid;
        return await AdminStatisticService.getUsersGrowthByMonth(request.params);

      default:
        return {
          statusCode: 404,
          success: false,
          message: `${routingKey} could not be found.`
        }
    }
  }
}

export default new StatisticsRPCService();