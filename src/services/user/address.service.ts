import BaseService from '@core/base.service';
import { CustomError } from '@errors/custom';

// interface
import { FuncResponse } from '@interfaces/response';
import {
  GetProvinceParams,
  GetProvincesParams,
  GetDistrictParams,
  GetDistrictsParams
} from '@interfaces/user';

// model primary
import ProvinceModel from '@models/primary/province.model';
import DistrictModel from '@models/primary/district.model';

// model replica
import ProvinceReplicaModel from '@models/replica/province.model';
import DistrictReplicaModel from '@models/replica/district.model';

export default new class Address extends BaseService {
  constructor() {
    super();
  }

  async getProvince(params: GetProvinceParams): Promise<FuncResponse<ProvinceModel>> {
    try {
      const province = await ProvinceReplicaModel.query()
        .findOne('id', params.provinceId);
      if (!(province instanceof ProvinceReplicaModel))
        throw new CustomError(this.errorCodes.PROVINCE_NOT_FOUND);

      return this.responseSuccess(province);
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getProvinces(params: GetProvincesParams): Promise<FuncResponse<object>> {
    try {
      const provinces = await ProvinceReplicaModel.query()
        .modify((queryBuilder) => {
          if (params.provinceId)
            queryBuilder.where('id', params.provinceId);

          if (params.title)
            queryBuilder.whereILike('title', params.title);
        });

      return this.responseSuccess(provinces);
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getDistrict(params: GetDistrictParams): Promise<FuncResponse<DistrictModel>> {
    try {
      const district = await DistrictReplicaModel.query()
        .findOne('id', params.districtId);
      if (!(district instanceof DistrictReplicaModel))
        throw new CustomError(this.errorCodes.DISTRICT_NOT_FOUND);

      return this.responseSuccess(district);
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async getDistricts(params: GetDistrictsParams): Promise<FuncResponse<object>> {
    try {
      const districts = await DistrictReplicaModel.query()
        .modify((queryBuidler) => {
          if (params.provinceId)
            queryBuidler.where('provinceId', params.provinceId);

          if (params.districtId)
            queryBuidler.where('id', params.districtId);

          if (params.title)
            queryBuidler.whereILike('title', params.title);
        })

      return this.responseSuccess(districts);
    } catch (error: any) {
      return this.responseError(error);
    }
  }
}