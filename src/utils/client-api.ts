import axios from 'axios';

// interface
import { GotParams, GetOptional } from '@interfaces/api-client';
import { FuncResponse } from '@interfaces/response';

export default new class ApiClient {
  private defaultHeader = { 'Content-Type': 'application/json; charset=UTF-8' };

  makeRequest = async (params: GotParams, optional?: GetOptional): Promise<any> => {
    try {
      const options = {
        ...params,
        method: params.method || 'POST',
        headers: params.headers || this.defaultHeader,
        timeout: params.timeout || 60_000,
      }

      if (params.jsonData) {
        Object.assign(options, {
          data: params.jsonData
        })
      }

      if (params.formData) {
        Object.assign(options, {
          data: params.formData
        })
      }

      const response = await axios(options);

      return {
        statusCode: 200,
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        success: false,
        message: error.message,
        error
      }
    }
  }
}