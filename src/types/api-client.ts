export interface GotParams {
  method?: 'GET' | 'POST' | 'PATCH';
  url: string;
  formData?: object;
  jsonData?: object;
  headers?: Record<string, string>;
  responseType?: 'json' | 'arraybuffer',
  timeout?: number
}

export interface GetOptional {
  logging: boolean;
}