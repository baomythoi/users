import BaseService from '@core/base.service';
import { CustomError } from '@errors/custom';

// model
import TrackingAccessModel from '@models/primary/tracking-access-management.model';

// model replica
import TrackingAccessReplicaModel from '@models/replica/tracking-access-management.model';

// interface
import { FuncResponse } from '@interfaces/response';
import {
  AddParams,
  GetAllParams
} from '@interfaces/tracking-access.interface';

export default new class TrackingAccessManagement extends BaseService {
  constructor() {
    super();
  }

  async add(params: AddParams): Promise<FuncResponse<object>> {
    try {
      await TrackingAccessModel.query()
        .insert(params);

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getAll(params: GetAllParams): Promise<FuncResponse<TrackingAccessModel[]>> {
    try {
      const results = await TrackingAccessReplicaModel.query()
        .modify((queryBuilder) => {
          if (params.accessTo)
            queryBuilder.where('accessTo', params.accessTo);

          if (params.accessUserId)
            queryBuilder.whereRaw(`?? ->> ? = ?`, ['accessData', 'userId', params.accessUserId]);
        })
        .orderBy('createdDate', 'DESC');

      return this.responseSuccess(results);
    } catch (error: any) {
      return this.responseError(error);
    }
  }
}