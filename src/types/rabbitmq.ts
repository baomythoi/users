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
  params: any;
}