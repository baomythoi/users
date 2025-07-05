import ClientApi from '@utils/client-api';
import type FormData from 'form-data';

import { FuncResponse } from '@interfaces/response';

export default new class G2 {
  async convertWordToPdf(uploadData: FormData): Promise<FuncResponse<{
    url: string;
  }>> {

    const uploadResult = await ClientApi.makeRequest({
      url: `${process.env.G2_URL}/convert/word/pdf`,
      headers: {
        ...uploadData.getHeaders(),
      },
      formData: uploadData
    })
    if (uploadResult.data.complete)
      return {
        statusCode: 200,
        success: true,
        data: {
          url: uploadResult.data.link
        }
      }

    return {
      statusCode: 500,
      success: false,
      message: uploadResult.message
    }
  }
}