export interface QueueConfig {
  name: string;
  handler: (msg: any) => Promise<object>;
}

export interface RequestParams {
  authentication: {
    username: string
  };
  params: any;
}

export interface PostMessagesParams {
  authentication?: {
    username: string
  };
  params?: any;
}

export interface MQLoggerPrarams {
  service: string;
  correlationId: string;
  queue: string;
  routingKey: string;
  replyTo?: string;
  request?: Record<string, any>;
  response?: Record<string, any>;
  status: 'success' | 'fail';
}

export interface ThirdPartyLoggerParams {
  url: string;
  request?: Record<string, any>;
  response?: Record<string, any>;
  status: 'success' | 'fail';
}