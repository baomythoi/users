import BaseService from '@core/base.service';
import BaseCommon from '@core/base.common';
import { CustomError } from '@errors/custom';
import { hashSync } from 'bcrypt';

// model
import UserModel from '@models/primary/user.model';

// repository
import UserRepository from '@repositories/user.repository';

// interface
import { FuncResponse } from '@interfaces/response';
import {
  ProfileParams,
  EditUserProfileParams,
  RegGSaleAccountParams,
  ActiveUserParams,
  ChangeUserPasswordParams,
  SetUserStatusParams,
} from '@interfaces/user';

class UserProfile extends BaseService {
  constructor() {
    super();
  }

  async get(params: ProfileParams): Promise<FuncResponse<object>> {
    try {
      const cached = await BaseCommon.redis.getCache(`users:${params.username}:open-api:profile`);
      if (cached) {
        return this.responseSuccess(cached);
      }

      const profile = await UserRepository.getProfile(params);
      if (!profile)
        throw new CustomError(this.errorCodes.NOT_FOUND);

      if (params.ignorePassword)
        delete profile['password'];

      await BaseCommon.redis.addCache({
        key: `users:${params.username}:open-api:profile`,
        value: JSON.stringify(profile)
      }, 60 * 60 * 24 * 30); // Cache valid for 30 days

      return this.responseSuccess(profile);
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getById(params: ProfileParams): Promise<FuncResponse<object>> {
    try {
      const cached = await this.common.redis.getCache(`users:${params.userId}:open-api:profile`);
      if (cached)
        return this.responseSuccess(cached);
  
      const profile = await UserRepository.getProfile({ userId: params.userId });
      if (!profile)
        throw new CustomError(this.errorCodes.NOT_FOUND);
  
      if (params.ignorePassword)
        delete profile.password;
  
      await this.common.redis.addCache({
        key: `users:${params.userId}:open-api:profile`,
        value: JSON.stringify(profile),
      }, 60 * 30); // 30 minutes
  
      return this.responseSuccess(profile);
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async edit(params: EditUserProfileParams, authentication: { username: string }): Promise<FuncResponse<object>> {
    try {
      const detail = await UserRepository.findByUsername(authentication.username);

      if (!detail)
        throw new CustomError(this.errorCodes.NOT_FOUND);

      await UserRepository.updateProfile(detail.uid, {
        phoneCode: params.phoneCode,
        phoneNumber: params.phoneNumber,
        firstName: params.firstName,
        lastName: params.lastName,
        middleName: params.middleName,
        avatar: params.avatar,
        gender: params.gender === 'M' ? 1 : 2,
        locale: params.locale,
        password: params.password ? hashSync(params.password, 10) : undefined,
      });

      const userDetail = await UserRepository.findByUsername(authentication.username);
      if (!userDetail)
        throw new CustomError(this.errorCodes.NOT_FOUND);

      // clear cache
      await BaseCommon.redis.clearCache(`users:${userDetail.username}:open-api:profile`);
      await BaseCommon.redis.clearCache(`users:${userDetail.id}:open-api:profile`);

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async register(params: RegGSaleAccountParams): Promise<FuncResponse<object>> {
    try {
      const result = await UserModel.transaction(async (trx) => {
        const isExist =
          await UserRepository.existsByUsername(params.username, 1, trx);

        if (isExist)
          throw new CustomError(this.errorCodes.CONFLICT);

        const insertResult = await UserRepository.create({
          username: params.username,
          password: hashSync(params.password, 10),
          roleId: params.roleId || 3,
          phoneNumber: params.phoneNumber,
          email: params.username,
          status: 2,
          locale: params.locale || 'en',
          createdAt: BaseCommon.moment.init().format(),
        }, trx);

        // Update extraInfo using repository
        await UserRepository.updateExtraInfo(
          insertResult.id, {
            secretKey: `${insertResult.id}${BaseCommon.nanoid.generateRandomId(
              16 - insertResult.id.toString().length
            )}`,
          }, trx
        );

        return insertResult.uid;
      });

      return this.responseSuccess({ userUid: result });
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async activeUser(params: ActiveUserParams): Promise<FuncResponse<object>> {
    try {
      const detail = await UserRepository.findByUsernameAndStatus(params.username, 2);

      if (!detail)
        throw new CustomError(this.errorCodes.NOT_FOUND);

      await UserRepository.updateByUid(detail.uid, { status: 1 });

      // clear cache
      await BaseCommon.redis.clearCache(`users:${params.username}:open-api:profile`);

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async changeUserPassword(params: ChangeUserPasswordParams): Promise<FuncResponse<object>> {
    try {
      // Find user using repository
      const detail = await UserRepository.findByUsername(params.username);

      if (!detail)
        throw new CustomError(this.errorCodes.NOT_FOUND);

      await UserRepository.updateByUid(detail.uid, { password: hashSync(params.newPassword, 10) });

      // clear cache
      await BaseCommon.redis.clearCache(`users:${params.username}:open-api:profile`);

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async setUserStatus(params: SetUserStatusParams): Promise<FuncResponse<object>> {
    try {
      const detail = await UserRepository.findByUid(params.userUid);

      if (!detail)
        throw new CustomError(this.errorCodes.NOT_FOUND);

      if (detail.status === params.status)
        return this.responseSuccess({ message: 'Người dùng đã ở trạng thái này' });

      await UserRepository.updateByUid(detail.uid, { status: params.status });
  
      // clear cache
      await BaseCommon.redis.clearCache(`users:${detail.username}:open-api:profile`);

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }
}

export default new UserProfile();