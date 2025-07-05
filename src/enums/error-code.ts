export interface ErrorDetails {
  [key: string]: {
    statusCode: number;
    code: string;
    message: string;
  }
}

export const ErrorDetailsMap: ErrorDetails = {
  INTERNAL_ERROR: {
    statusCode: 500,
    code: 'USERS_INTERNAL_ERROR',
    message: 'USERS | An unexpected error occurred.',
  },
  SERVICE_UNAVAILABLE: {
    statusCode: 503,
    code: 'USERS_SERVICE_UNAVAILABLE',
    message: 'USERS | The service is temporarily unavailable.',
  },
  BAD_REQUEST: {
    statusCode: 400,
    code: 'USERS_BAD_REQUEST',
    message: 'USERS | The request could not be understood or is missing required parameters.',
  },
  UNAUTHORIZED: {
    statusCode: 401,
    code: 'USERS_UNAUTHORIZED',
    message: 'USERS | The request lacks valid authentication credentials.',
  },
  FORBIDDEN: {
    statusCode: 403,
    code: 'USERS_FORBIDDEN',
    message: 'USERS | The server understood the request but refuses to authorize it.',
  },
  NOT_FOUND: {
    statusCode: 404,
    code: 'USERS_NOT_FOUND',
    message: 'USERS | The requested resource could not be found.',
  },
  CONFLICT: {
    statusCode: 409,
    code: 'USERS_CONFLICT',
    message: 'USERS | The request could not be completed due to a conflict with the current state of the resource (e.g., attempting to create a duplicate resource).',
  },
  RATE_LIMIT_EXCEEDED: {
    statusCode: 429,
    code: 'USERS_RATE_LIMIT_EXCEEDED',
    message: 'USERS | The request exceeds the rate limit allowed for the user or client.',
  },
  FILE_SIZE_LIMIT_EXCEEDED: {
    statusCode: 413,
    code: 'USERS_FILE_SIZE_LIMIT_EXCEEDED',
    message: 'USERS | The uploaded file exceeds the size limit.',
  },
  FILE_TYPE_NOT_SUPPORTED: {
    statusCode: 415,
    code: 'USERS_FILE_TYPE_NOT_SUPPORTED',
    message: 'USERS | The uploaded file type is not supported.',
  },
  INVALID_PASSWORD: {
    statusCode: 400,
    code: 'USERS_INVALID_PASSWORD',
    message: 'USERS | Invalid password.'
  },
  PASSWORD_NOT_MATCH: {
    statusCode: 400,
    code: 'USERS_PASSWORD_NOT_MATCH',
    message: 'USERS | Passwords do not match.'
  },
  AFF_PROFILE_NOT_SYNCED: {
    statusCode: 404,
    code: 'USERS_AFF_PROFILE_NOT_SYNCED',
    message: 'USERS | Affiliate User Profile Not Synced.'
  },
  AFF_PROFILE_SYNCED: {
    statusCode: 400,
    code: 'USERS_AFF_PROFILE_SYNCED',
    message: 'USERS | Affiliate User Profile have Synced.'
  },
  PROVINCE_NOT_FOUND: {
    statusCode: 404,
    code: 'USERS_PROVINCE_NOT_FOUND',
    message: 'USERS | The requested province could not be found.',
  },
  DISTRICT_NOT_FOUND: {
    statusCode: 404,
    code: 'USERS_DISTRICT_NOT_FOUND',
    message: 'USERS | The requested district could not be found.',
  },
  PRIVATE_ID_IS_CONFLICT: {
    statusCode: 409,
    code: 'USERS_PRIVATE_ID_IS_CONFLICT',
    message: 'USERS | The request could not be completed due to a conflict with the current state of the resource (e.g., attempting to create a duplicate resource).'
  },
  EKYC_PROFILE_NOT_FOUND: {
    statusCode: 404,
    code: 'USERS_EKYC_PROFILE_NOT_FOUND',
    message: 'USERS | The requested ekyc profile could not be found.',
  },
  SIGNATURE_DOWNLOAD_FAIL: {
    statusCode: 400,
    code: 'USERS_SIGNATURE_DOWNLOAD_FAIL',
    message: 'USERS | signature image download fail.'
  },
  AFF_PROFILE_NOT_FOUND: {
    statusCode: 404,
    code: 'USERS_AFF_PROFILE_NOT_FOUND',
    message: 'USERS | Affiliate User Profile could not be found.'
  },
  NEXT_SALE_LEVEL_NOT_SUPPORTED: {
    statusCode: 400,
    code: 'USERS_NEXT_SALE_LEVEL_NOT_SUPPORTED',
    message: 'USERS | Next sale level is not supported.'
  }
};

export enum ErrorCodes {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FILE_SIZE_LIMIT_EXCEEDED = 'FILE_SIZE_LIMIT_EXCEEDED',
  FILE_TYPE_NOT_SUPPORTED = 'FILE_TYPE_NOT_SUPPORTED',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  PASSWORD_NOT_MATCH = 'PASSWORD_NOT_MATCH',
  AFF_PROFILE_NOT_SYNCED = 'AFF_PROFILE_NOT_SYNCED',
  AFF_PROFILE_SYNCED = 'AFF_PROFILE_SYNCED',
  PROVINCE_NOT_FOUND = 'PROVINCE_NOT_FOUND',
  DISTRICT_NOT_FOUND = 'DISTRICT_NOT_FOUND',
  PRIVATE_ID_IS_CONFLICT = 'PRIVATE_ID_IS_CONFLICT',
  EKYC_PROFILE_NOT_FOUND = 'EKYC_PROFILE_NOT_FOUND',
  SIGNATURE_DOWNLOAD_FAIL = 'SIGNATURE_DOWNLOAD_FAIL',
  AFF_PROFILE_NOT_FOUND = 'AFF_PROFILE_NOT_FOUND',
  NEXT_SALE_LEVEL_NOT_SUPPORTED = 'NEXT_SALE_LEVEL_NOT_SUPPORTED'
}