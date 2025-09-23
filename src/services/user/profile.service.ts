import BaseService from '@core/base.service';
import { CustomError } from '@errors/custom';
import { hashSync } from 'bcrypt';

// interface
import { FuncResponse } from '@interfaces/response';
import {
  ProfileParams,
  EditUserProfileParams,
  RegGSaleAccountParams,
  UserData
} from '@interfaces/user';

// model
import UserModel from '@models/primary/user.model';
import UserReplicaModel from '@models/replica/user.model';

export default new class UserProfile extends BaseService {
  constructor() {
    super();
  }

  async get(params: ProfileParams): Promise<FuncResponse<object>> {
    try {
      const detail = await UserReplicaModel.query()
        .alias('user')
        .modify((queryBuilder) => {
          if (params.userId)
            queryBuilder.where('user.id', params.userId);

          if (params.username)
            queryBuilder.where('user.username', params.username);

          if (params.privateId)
            queryBuilder.where('user.privateId', params.privateId);

          if (params.status)
            queryBuilder.where('user.status', params.status);

          if (params.secretKey)
            queryBuilder.whereRaw(`?? ->> ? = ?`, ['user.extra_info', 'secretKey', params.secretKey]);
        })
        .select(
          'user.id',
          'user.uid',
          'user.fullname',
          'user.username',
          'user.password',
          'user.avatar',
          'user.phoneNumber',
          'user.email',
          'user.roleId',
          'user.locale',
        )
        .select(UserReplicaModel.raw(`
          "user".extra_info ->> 'secretKey' AS "secretKey"
        `))
        .first();

      if (!(detail instanceof UserReplicaModel))
        throw new CustomError(this.errorCodes.NOT_FOUND);

      if (params.ignorePassword)
        delete detail['password']

      await this.common.redis.addCache({
        key: `users:${detail.username}:open-api:profile`,
        value: JSON.stringify(detail)
      }, 60 * 60 * 24 * 30); // hieu luc trong 30 ngay

      return this.responseSuccess(detail)
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async edit(params: EditUserProfileParams, authentication: { username: string }): Promise<FuncResponse<object>> {
    try {
      await UserModel.transaction(async (trx) => {
        await trx.raw('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');

        const detail = await UserModel.query(trx)
          .findOne('username', authentication.username);
        if (!(detail instanceof UserModel))
          throw new CustomError(this.errorCodes.NOT_FOUND);

        const extraInfo = detail.extraInfo;
        
        if (params.dob) {
          Object.assign(extraInfo, {
            dob: params.dob
          })
          delete params.dob;
        }

        await UserModel.query(trx)
          .patch({
            ...params,
            extraInfo
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

  async register(params: RegGSaleAccountParams): Promise<FuncResponse<object>> {
    try {
      const result = await UserModel.transaction(async (trx) => {
        const isExist = await UserModel.query(trx)
          .where('username', params.username)
          .where('status', 1)
          .first();

        if (isExist)
          throw new CustomError(this.errorCodes.CONFLICT);

        const insertResult = await UserModel.query(trx)
          .insert({
            username: params.username,
            password: hashSync(params.password, 10),
            roleId: 3,
            phoneNumber: params.phoneNumber,
            email: params.username,
            status: 1,
            locale: params.locale || 'en',
            createdAt: this.common.moment.init().format()
          })
          .returning(['id', 'uid']);

        await UserModel.query(trx)
          .patch({
            extraInfo: {
              secretKey: `${insertResult.id}${this.common.nanoid.generateRandomId(
                16 - insertResult.id.toString().length
              )}`,
            },
          })
          .where('id', insertResult.id);

        return insertResult.uid;
      });

      return this.responseSuccess({ userUid: result });
    } catch (error: any) {
      return this.responseError(error);
    }
  }
}