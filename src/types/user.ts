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
  firstName?: string;
  lastName?: string;
  middleName?: string;
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
  firstName: string;
  lastName: string;
  middleName?: string;
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

export interface UsersListParams {
  page: number;
  pageSize: number;
  status?: number;
  roleId?: number;
  search?: string;
  packageCode?: string;
}

export interface UserDetailParams {
  userUid: string;
}

export interface PackageInfo {
  packageCode: string;
  totalTokens: number;
  usedTokens: number;
  availableTokens: number;
  startDate: string | null;
  endDate: string | null;
  status: UserPackageStatus;
}

export interface Connections {
  totalChannels: number;
  facebookPages: ConnectedPage[];
  zaloOAs?: ConnectedPage[];
}

export interface UserDetail {
  uid: string;
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatar: string;
  roleId: number;
  roleName: string;
  status: number;
  statusName: string;
  locale: string;
  gender?: number;
  packageInfo: PackageInfo;
  connections: Connections;
  createdAt: string;
  updatedAt: string | null;
}

export interface UsersListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  results: UserListItem[];
}

export interface UserListItem {
  uid: string;
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneCode: string | null;
  phoneNumber: string | null;
  avatar: string;
  roleId: number;
  status: number;
  locale: string;
  gender?: number;
  packageName?: string;
  packageCode?: string;
  totalTokens?: number;
  usedTokens?: number;
  availableTokens?: number;
  packageStartDate?: string | null;
  packageEndDate?: string | null;
  channelCount?: string;
  facebookPages?: ConnectedPage[];
  zaloOAs?: ConnectedPage[];
  createdAt: string;
  updatedAt: string | null;
}

export enum UserPackageStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  NONE = 'None',
}

export interface ConnectedPage {
  id: number;
  name: string;
}

export enum UserStatus {
  InActive = 0,
  Active = 1,
  Suspended = 2,
}

export interface SetUserStatusParams {
  userUid: string;
  status: UserStatus;
}

export interface UserProfileResult {
  id: number;
  uid: string;
  fullname: string;
  username: string;
  password?: string;
  avatar: string;
  phoneCode: string;
  phoneNumber: string;
  email: string;
  roleId: number;
  locale: string;
  secretKey?: string;
}

export interface GetTotalUsersParams {
  status?: number;
  startDate?: string;
  endDate?: string;
}

export interface GetUsersCountByPackageParams {
  startDate?: string;
  endDate?: string;
}