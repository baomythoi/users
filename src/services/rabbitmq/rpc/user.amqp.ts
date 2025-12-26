import BaseCommon from '@core/base.common';

// interface
import { FuncResponse } from '@interfaces/response';
import { RequestParams } from '@interfaces/rabbitmq';

// schema
import {
  ProfileSchema,
  EditUserProfileSchema,
  RegGSaleAccountSchema,
  ActiveUserSchema,
  ChangeUserPasswordSchema
} from '@schemas/user/profile';
import {
  GetTotalUsersParamsSchema,
  GetUsersCountByPackageParamsSchema,
  GetUsersGrowthByMonthParamsSchema,
  GetUsersListSchema,
  SetUserStatusParamsSchema,
  UserDetailParamsSchema
} from '@schemas/user/users.schema';

// service
import UserProfile from '@services/user/profile.service';
import UserService from '@services/user/users.service';

class UsersRPCService {
  public routing = 'rpc.users.*.routing';

  async processMessage(routingKey: string, request: RequestParams): Promise<FuncResponse<object>> {
    let isValid: FuncResponse<object>;

    switch (routingKey) {
      case 'rpc.users.profile.routing':
        isValid = await BaseCommon.validate.compile(request.params, ProfileSchema);
        if (!isValid.success) return isValid;
        return await UserProfile.get(request.params);

      case 'rpc.users.profile_by_id.routing':
        isValid = await BaseCommon.validate.compile(request.params, ProfileSchema);
        if (!isValid.success) return isValid;
        return await UserProfile.getById(request.params);

      case 'rpc.users.edit_profile.routing':
        isValid = await BaseCommon.validate.compile(request.params, EditUserProfileSchema);
        if (!isValid.success) return isValid;
        return await UserProfile.edit(request.params, request.authentication);

      case 'rpc.users.register.routing':
        isValid = await BaseCommon.validate.compile(request.params, RegGSaleAccountSchema);
        if (!isValid.success) return isValid;
        return await UserProfile.register(request.params);

      case 'rpc.users.activate.routing':
        isValid = await BaseCommon.validate.compile(request.params, ActiveUserSchema);
        if (!isValid.success) return isValid;
        return await UserProfile.activeUser(request.params);

      case 'rpc.users.change_password.routing':
        isValid = await BaseCommon.validate.compile(request.params, ChangeUserPasswordSchema);
        if (!isValid.success) return isValid;
        return await UserProfile.changeUserPassword(request.params);

      case 'rpc.users.get_list.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetUsersListSchema);
        if (!isValid.success) return isValid;
        return await UserService.getList(request.params, request.authentication);

      case 'rpc.users.get_detail.routing':
        isValid = await BaseCommon.validate.compile(request.params, UserDetailParamsSchema);
        if (!isValid.success) return isValid;
        return await UserService.getDetail(request.params);

      case 'rpc.users.set_status.routing':
        isValid = await BaseCommon.validate.compile(request.params, SetUserStatusParamsSchema);
        if (!isValid.success) return isValid;
        return await UserProfile.setUserStatus(request.params);

      case 'rpc.users.get_total.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetTotalUsersParamsSchema);
        if (!isValid.success) return isValid;
        return await UserService.getTotalUsers(request.params);

      case 'rpc.users.get_total_expired.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetTotalUsersParamsSchema);
        if (!isValid.success) return isValid;
        return await UserService.getTotalExpiredUsers(request.params);

      case 'rpc.users.get_total_active.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetTotalUsersParamsSchema);
        if (!isValid.success) return isValid;
        return await UserService.getTotalActiveUsers(request.params);

      case 'rpc.users.get_top_expiring.routing':
        return await UserService.getTopUsersExpiringSoon();

      case 'rpc.users.get_latest.routing':
        return await UserService.getLatestUsers();

      case 'rpc.users.get_count_by_package.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetUsersCountByPackageParamsSchema);
        if (!isValid.success) return isValid;
        return await UserService.getUsersCountByPackage(request.params);

      case 'rpc.users.get_growth_by_month.routing':
        isValid = await BaseCommon.validate.compile(request.params, GetUsersGrowthByMonthParamsSchema);
        if (!isValid.success) return isValid;
        return await UserService.getUsersGrowthByMonth(request.params);

      default:
        return {
          statusCode: 404,
          success: false,
          message: `${routingKey} could not be found.`
        }
    }
  }
}

export default new UsersRPCService();