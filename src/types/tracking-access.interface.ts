export interface AddParams {
  userId?: number;
  userUid?: string;
  user: Record<string, any>;
  accessTo: string;
  accessData: Record<string, any>;
}

export interface GetAllParams {
  accessTo?: string;
  accessUserId?: number;
}