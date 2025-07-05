import BaseService from '@core/base.service';
import { CustomError } from '@errors/custom';
import { hashSync } from 'bcrypt';

// interface
import { FuncResponse } from '@interfaces/response';
import { BH365CreateUserParams } from '@interfaces/user';

// model
import UserModel from '@models/primary/user.model';

export default new class UserBH365 extends BaseService {
  constructor() {
    super();
  }

  async create(params: BH365CreateUserParams): Promise<FuncResponse<object>> {
    try {
      await UserModel.transaction(async (trx) => {
        const isExist = await UserModel.query(trx)
          .where('username', params.usr)
          .first();
        if (isExist instanceof UserModel)
          throw new CustomError(this.errorCodes.CONFLICT);

        await UserModel.query(trx)
          .insert({
            username: params.usr,
            password: hashSync(params.pwd, 10),
            roleId: 3,
            phoneNumber: params.usr,
            fullname: params.fullname,
            privateId: params.privateId,
            email: params.email,
            saleLevelId: 8,
            merchantId: 15,
            extraInfo: {
              address: params.address,
              app: 'bh365',
              role: 'customer',
              requireChangePwd: true
            },
            createdDate: this.common.moment.init().format('YYYY-MM-DD HH:mm:ss')
          })
      })

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }
}