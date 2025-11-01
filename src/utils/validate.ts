import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { FuncResponse } from '@interfaces/response';

export default new class Validate {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();

    addFormats(this.ajv);
  }

  async compile(params: object, schemas: object): Promise<FuncResponse<object>> {
    const validate = this.ajv.compile(schemas);
    if (validate(params))
      return {
        statusCode: 200,
        success: true
      }

    const resultErr = {
      statusCode: 400,
      success: false,
      code: 'users_validate_exception',
      message: 'Unknown error occurred'
    }

    if (validate.errors)
      Object.assign(resultErr, {
        message: validate.errors[0].message,
        error: validate.errors
      })

    return resultErr;
  }
}