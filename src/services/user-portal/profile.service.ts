import { CustomError } from '@errors/custom';

// core
import BaseService from '@core/base.service';

// interface
import { FuncResponse } from '@interfaces/response';
import {
  ProfileParams,
  EditUserPortalProfileParams,
  ChangePasswordParams,
  UserPortal,
  GetAffUserByRoleParams,
} from '@interfaces/user';

// model
import UserPortalModel from '@models/primary/user-portal.model';

// lib
import { compareSync, hashSync } from 'bcrypt';

export default new class UserPortalProfile extends BaseService {
  constructor() {
    super();
  }

  getByUsername = async (params: ProfileParams): Promise<FuncResponse<object>> => {
    try {
      const detail = await UserPortalModel.query()
        .modify((queryBuilder) => {
          if (params.uid)
            queryBuilder.where('uid', params.uid);

          if (params.userId)
            queryBuilder.where('userId', params.userId);

          if (params.username)
            queryBuilder.where('username', params.username);

          if (params.status)
            queryBuilder.where('status', params.status);
        })
        .first();
      if (!(detail instanceof UserPortalModel))
        throw new CustomError(this.errorCodes.NOT_FOUND);

      await this.common.redis.addCache({
        key: `users:${detail.username}:open-api:profile`,
        value: JSON.stringify(detail)
      }, 60 * 60 * 24 * 30); // hieu luc trong 30 ngay

      return this.responseSuccess(detail)
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async edit(params: EditUserPortalProfileParams, authentication: { username: string }): Promise<FuncResponse<object>> {
    try {
      await UserPortalModel.transaction(async (trx) => {
        await trx.raw('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');

        await UserPortalModel.query(trx)
          .patch({
            ...params,
            updatedDate: this.common.moment.init().format('YYYY-MM-DD HH:mm:ss')
          })
          .where('username', authentication.username);
      });

      // clear cache
      await this.common.redis.clearCache(`users:${authentication.username}:open-api:profile`);

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async changePassword(params: ChangePasswordParams, authentication: { username: string }): Promise<FuncResponse<object>> {
    try {
      if (params.newPassword !== params.passwordConfirmation)
        throw new CustomError(this.errorCodes.PASSWORD_NOT_MATCH);

      let cacheUser: UserPortal = await this.common.redis.getCache(`users:${authentication.username}:open-api:profile`);
      if (!cacheUser) {
        const user = await UserPortalModel.query()
          .where('username', authentication.username)
          .where('status', 1)
          .first();

        if (!(user instanceof UserPortalModel))
          throw new CustomError(this.errorCodes.NOT_FOUND);

        cacheUser = user;
      }

      const validPassword = compareSync(params.currentPassword, cacheUser.password);
      if (!validPassword)
        throw new CustomError(this.errorCodes.INVALID_PASSWORD);

      await UserPortalModel.transaction(async (trx) => {
        await trx.raw('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');

        await UserPortalModel.query(trx)
          .patch({
            password: hashSync(params.newPassword, 10),
            updatedDate: this.common.moment.init().format('YYYY-MM-DD HH:mm:ss')
          })
          .where('uid', cacheUser.uid)
      });

      // clear cache
      await this.common.redis.clearCache(`users:${authentication.username}:open-api:profile`);

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  getAffUserByRole = async (params: GetAffUserByRoleParams): Promise<FuncResponse<object>> => {
    try {
      const affUsersResult = await UserPortalModel.query()
        .whereIn('roleCode', params.roleCodes)

      const affUsers = affUsersResult.map(user => {
        return {
          uid: user.uid,
          fullname: user.fullname,
        }
      })

      return this.responseSuccess(affUsers)
    } catch (error: any) {
      return this.responseError(error);
    }
  }
}