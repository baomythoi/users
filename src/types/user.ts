export interface ProfileParams {
  uid?: string;
  userId?: number;
  username?: string;
  privateId?: string;
  status?: number;
  secretKey?: string;
  ignorePassword?: boolean;
}

export interface EditUserProfileParams {
  phoneCode?: string;
  phoneNumber?: string;
  fullname?: string;
  avatar?: string;
  gender?: 'M' | 'F';
  locale?: string;
  password?: string;
}

export interface BH365CreateUserParams {
  usr: string;
  pwd: string;
  fullname: string;
  privateId?: string;
  email?: string;
  address?: string;
}

export interface EditUserPortalProfileParams {
  fullname?: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
  passwordConfirmation: string;
}

export interface UserPortal {
  uid: string;
  username: string;
  password: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  roleCode: string;
  merchantId: number;
  agencyId: number;
  providerId: number;
  userId: number;
  userIdForCommission: number;
  extraInfo: Record<string, any>;
  status: number;
  lastLogin: string;
  updatedDate: string;
  createdDate: string;
}

export interface UserData {
  id: number;
  username: string;
  parentId?: number;
}
export interface IBasicUser {
  id: number;
  username: string;
  fullname: string;
  saleLevelId: number;
  merchantId: number;
  agencyId: number;
}

export interface UserData {
  id: number;
  username: string;
  password?: string;
  roleId: number;
  fullname: string;
  privateId: string;
  phoneNumber: string;
  email: string;
  gender: number;
  saleLevelId: number;
  masterMerchantId: number;
  merchantId: number;
  agencyId: number;
  avatar: string;
  referralCode: string;
  saleWallet: number;
  wallet: number;
  reward: number;
  internalWallet: number;
  extraInfo: Record<string, any>;
  status: number;
  createdDate: string;
  updatedDate: string;
}

export interface GetProvinceParams {
  provinceId: number;
}

export interface GetProvincesParams {
  provinceId?: number;
  title?: string;
}

export interface GetDistrictParams {
  districtId: number;
}

export interface GetDistrictsParams {
  provinceId?: number;
  districtId?: number;
  title?: string;
}

export interface RegGSaleAccountParams {
  username: string;
  password: string;
  fullname: string;
  roleId?: number;
  phoneCode: string;
  phoneNumber: string;
  locale: string;
}

export interface UserDailyRevenueData {
  userId: number;
  totalRevenueGroup?: number
}

export interface GetAffUserByRoleParams {
  roleCodes: string[];
}

export interface ActiveUserParams {
  username: string;
}

export interface ChangeUserPasswordParams {
  username: string;
  newPassword: string;
}