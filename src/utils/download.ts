import ClientApi from '@utils/client-api';

// interface
import { FuncResponse } from '@interfaces/response';

export default new class Download {
  async fromUrl(url: string): Promise<FuncResponse<string>> {
    const downloadResult = await ClientApi.makeRequest({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });

    return downloadResult;
  }
}