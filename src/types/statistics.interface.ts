export interface GetTotalUsersParams {
  status?: number;
  startDate?: string;
  endDate?: string;
}

export interface GetUsersCountByPackageParams {
  startDate?: string;
  endDate?: string;
}

export interface GetUsersGrowthByMonthParams {
  startDate?: string;
  endDate?: string;
}