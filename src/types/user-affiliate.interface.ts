type category = 'phi_nhan_tho' | 'nhan_tho' | 'tai_chinh';

export interface GetAllUsersParams {
  fromDate?: string;
  toDate?: string;
  productCode?: string[];
  participationType?: 'ban_hang' | 'gioi_thieu';
  insuranceCategory?: category[];
  phoneNumber?: string;
  page: number;
  pageSize: number;
}

export interface EditAffProfileParams {
  provinceId?: number;
  districtId?: number;
  address?: string;
  insuranceCategory?: category[];
  agentCode?: string;
  productCode?: string[];
  activityAreaId?: number;
  professionalExperience?: string;
  futureOrientation?: string;
  profileImages?: string[];
  certificateImages?: string[];
}

export interface RegisterAffProfileParams {
  provinceId: number;
  districtId: number;
  address: string;
  insuranceCategory: category[];
  participationType: 'ban_hang' | 'gioi_thieu';
  agentCode?: string;
  productCode: string[];
  activityAreaId?: number;
  professionalExperience?: string;
  futureOrientation?: string;
  certificateImages?: string[];
  profileImages?: string[];
}



export interface SyncAffProfileParams {
  provinceId: number;
  districtId: number;
  address: string;
  insuranceCategory: category[];
  participationType: 'ban_hang';
  agentCode?: string;
  productCode: string[];
  activityAreaId?: number;
  professionalExperience?: string;
  futureOrientation?: string;
  certificateImages?: string[];
  profileImages?: string[];
}

export interface GetAffProfileParams {
  uid?: string;
  userId?: number;
  userCode?: string;
  status?: 'Active' | 'Pending_Lock_Approval' | 'Pending_Review' | 'Locked';
}

export interface AdminEditProfileParams {
  uid: string;
  status: 'Active' | 'Pending_Lock_Approval' | 'Pending_Review' | 'Locked';
  reasonForSuspension?: string;
}

export interface GetUsersParams {
  page: number;
  pageSize: number;
}

export interface GetUserParams {
  uid: string;
}

export interface AdminGetDetailParams {
  uid: string;
}